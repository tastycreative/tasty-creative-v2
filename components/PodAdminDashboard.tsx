"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Database,
  Settings,
  Activity,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  ClipboardList,
  Save,
  X,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  ChevronDown,
  Eye,
  Star,
  AlertCircle,
  Shield,
  UserCheck,
  User,
  ExternalLink,
  Link,
  Edit2,
  UserMinus,
  Check,
} from "lucide-react";
import { updateUserRole } from "@/app/actions/admin";
import { Role } from "@prisma/client";

interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalCreators: number;
  systemStatus: "healthy" | "warning" | "error";
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
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
  members: TeamMember[];
  tasks: Task[];
  sheetUrl?: string;
  rowNumber: number;
}

interface EditingState {
  isEditing: boolean;
  teamId?: string;
  memberId?: string;
  taskId?: string;
}

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

const PodAdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalCreators: 0,
    systemStatus: "healthy",
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "teams" | "users">(
    "overview"
  );
  const [editingState, setEditingState] = useState<EditingState>({
    isEditing: false,
  });
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "POD" | "USER" | "GUEST">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "completed"
  >("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedPodUser, setSelectedPodUser] = useState<SystemUser | null>(
    null
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState<string | null>(null);
  const [editingTeamNameValue, setEditingTeamNameValue] = useState("");
  const [updatingTeamName, setUpdatingTeamName] = useState<string | null>(null);
  const [teamNameSuccess, setTeamNameSuccess] = useState<string | null>(null);
  const [editingSheetUrl, setEditingSheetUrl] = useState<string | null>(null);
  const [editingSheetUrlValue, setEditingSheetUrlValue] = useState("");
  const [updatingSheetUrl, setUpdatingSheetUrl] = useState<string | null>(null);
  const [sheetUrlSuccess, setSheetUrlSuccess] = useState<string | null>(null);
  const [showTeamMenu, setShowTeamMenu] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [showTasksModal, setShowTasksModal] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState<string | null>(null);
  const [podUsers, setPodUsers] = useState<SystemUser[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    dueDate: ''
  });

  // Constants for API calls
  const DEFAULT_SPREADSHEET_URL =
    "https://docs.google.com/spreadsheets/d/1sTp3x6SA4yKkYEwPUIDPNzAPiu0RnaV1009NXZ7PkZM/edit?gid=0#gid=0";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserDropdown &&
        !(event.target as Element).closest(".user-dropdown-container")
      ) {
        setShowUserDropdown(false);
      }
      if (
        showTeamMenu &&
        !(event.target as Element).closest(".team-menu-container")
      ) {
        setShowTeamMenu(null);
      }
      if (
        showAddMemberDropdown &&
        !(event.target as Element).closest(".add-member-dropdown-container")
      ) {
        setShowAddMemberDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown, showTeamMenu, showAddMemberDropdown]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-500/30";
    }
  };

  const getTeamStats = (team: Team) => {
    const totalTasks = team.tasks.length;
    const completedTasks = team.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgressTasks = team.tasks.filter(
      (task) => task.status === "in-progress"
    ).length;
    const overdueTasks = team.tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed"
    ).length;

    return { totalTasks, completedTasks, inProgressTasks, overdueTasks };
  };

  // API Functions
  const fetchAvailableTeams = async () => {
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
        const apiTeams: Team[] = await Promise.all(
          result.teams.map(async (apiTeam: any) => {
            const teamData = await fetchTeamData(apiTeam.row);
            return {
              id: `team-${apiTeam.row}`,
              name: apiTeam.name,
              description:
                teamData?.description || `Team from row ${apiTeam.row}`,
              members: teamData?.members || [],
              tasks: teamData?.tasks || [],
              sheetUrl: teamData?.sheetUrl,
            };
          })
        );
        setTeams(apiTeams);
        return apiTeams;
      }
      return [];
    } catch (err) {
      console.error("Error fetching available teams:", err);
      return [];
    }
  };

  const fetchTeamData = async (rowNumber: number, retryCount = 0) => {
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
        if (
          response.status === 429 &&
          errorText.includes("Quota exceeded") &&
          retryCount < 3
        ) {
          console.log(
            `Quota exceeded, retrying in ${(retryCount + 1) * 2} seconds...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, (retryCount + 1) * 2000)
          );
          return fetchTeamData(rowNumber, retryCount + 1);
        }
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const basicData = result.data;

        const teamMembers: TeamMember[] =
          basicData.teamMembers?.map((member: any, index: number) => ({
            id: `member-${rowNumber}-${index}`,
            name: member.name,
            role: member.role,
            email:
              member.email ||
              `${member.name.toLowerCase().replace(" ", ".")}@example.com`,
          })) || [];

        const tasks: Task[] =
          teamMembers.length > 0
            ? [
                {
                  id: `task-${rowNumber}-1`,
                  title: "Review team performance metrics",
                  description:
                    "Analyze current team productivity and identify improvement areas",
                  assignedTo: teamMembers[0]?.id || "",
                  status: "in-progress",
                  priority: "medium",
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                },
                {
                  id: `task-${rowNumber}-2`,
                  title: "Prepare weekly report",
                  description:
                    "Compile team activities and accomplishments for the week",
                  assignedTo: teamMembers[teamMembers.length - 1]?.id || "",
                  status: "not-started",
                  priority: "high",
                  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                },
              ]
            : [];

        return {
          description: `${basicData.teamName} - Managed team`,
          members: teamMembers,
          tasks: tasks,
          sheetUrl: basicData.schedulerSpreadsheetUrl,
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching team data:", err);
      if (
        err instanceof Error &&
        err.message.includes("quota") &&
        retryCount < 3
      ) {
        console.log(
          `Retrying team data fetch after error, attempt ${retryCount + 1}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, (retryCount + 1) * 2000)
        );
        return fetchTeamData(rowNumber, retryCount + 1);
      }
      return null;
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      const filteredUsers = result.users.filter((user: SystemUser) =>
        ["GUEST", "USER", "POD"].includes(user.role)
      );
      const podOnlyUsers = result.users.filter((user: SystemUser) =>
        user.role === "POD"
      );

      setUsers(filteredUsers);
      setPodUsers(podOnlyUsers);

      // Update stats with POD users count
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: podOnlyUsers.length
      }));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Member management functions
  const addMemberToTeam = async (teamId: string, userId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const user = podUsers.find(u => u.id === userId);
      if (!user) return;

      const newMember = {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        role: user.role as Role
      };

      const updatedMembers = [...team.members, newMember];
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, members: updatedMembers }
          : t
      ));

      setShowAddMemberDropdown(null);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member to team');
    }
  };

  const removeMemberFromTeam = async (teamId: string, memberId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedMembers = team.members.filter(m => m.id !== memberId);
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, members: updatedMembers }
          : t
      ));
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member from team');
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, newRole: Role) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedMembers = team.members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      );
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, members: updatedMembers }
          : t
      ));

      setEditingMember(null);
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  };

  // Task management functions
  const addTaskToTeam = async (teamId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team || !newTaskData.title.trim()) return;

      const newTask = {
        id: `task-${Date.now()}`,
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim(),
        status: 'not-started' as const,
        priority: newTaskData.priority,
        assignedTo: newTaskData.assignedTo || '',
        dueDate: newTaskData.dueDate || ''
      };

      const updatedTasks = [...team.tasks, newTask];
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, tasks: updatedTasks }
          : t
      ));

      // Reset form
      setNewTaskData({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
      });
      setShowAddTaskForm(null);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task to team');
    }
  };

  const removeTaskFromTeam = async (teamId: string, taskId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedTasks = team.tasks.filter(t => t.id !== taskId);
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, tasks: updatedTasks }
          : t
      ));
    } catch (error) {
      console.error('Error removing task:', error);
      alert('Failed to remove task from team');
    }
  };

  const updateTaskStatus = async (teamId: string, taskId: string, newStatus: 'not-started' | 'in-progress' | 'completed' | 'on-hold') => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedTasks = team.tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, tasks: updatedTasks }
          : t
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const updateTaskAssignment = async (teamId: string, taskId: string, newAssignee: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedTasks = team.tasks.map(t => 
        t.id === taskId ? { ...t, assignedTo: newAssignee } : t
      );
      
      // Update team in state
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, tasks: updatedTasks }
          : t
      ));

      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task assignment:', error);
      alert('Failed to update task assignment');
    }
  };

  // Fetch POD users separately for member dropdown
  const fetchPodUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      const podOnlyUsers = result.users.filter((user: SystemUser) =>
        user.role === "POD"
      );
      setPodUsers(podOnlyUsers);
    } catch (err) {
      console.error("Error fetching POD users:", err);
    }
  };

  // Team name update function
  const updateTeamName = async (teamId: string, newName: string) => {
    if (!newName.trim()) return;

    setUpdatingTeamName(teamId);
    try {
      // Extract row number from team ID (format: "team-{rowNumber}")
      const rowNumber = parseInt(teamId.replace('team-', ''));
      if (isNaN(rowNumber)) {
        throw new Error('Invalid team ID format');
      }

      // Call the API to update the Google Sheet
      const response = await fetch('/api/pod/update-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          rowNumber: rowNumber,
          newTeamName: newName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team name');
      }

      const result = await response.json();
      
      // Update team in local state
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, name: newName.trim() } : team
      ));

      setTeamNameSuccess(teamId);
      setTimeout(() => setTeamNameSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating team name:", err);
      // Revert local state on error
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, name: editingTeamNameValue } : team
      ));
      
      // Show error to user
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team name';
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingTeamName(null);
      setEditingTeamName(null);
      setEditingTeamNameValue("");
    }
  };

  // Sheet URL update function
  const updateSheetUrl = async (teamId: string, newUrl: string) => {
    if (!newUrl.trim()) return;

    setUpdatingSheetUrl(teamId);
    try {
      // Extract row number from team ID (format: "team-{rowNumber}")
      const rowNumber = parseInt(teamId.replace('team-', ''));
      if (isNaN(rowNumber)) {
        throw new Error('Invalid team ID format');
      }

      // Call the API to update the Google Sheet
      const response = await fetch('/api/pod/update-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          rowNumber: rowNumber,
          newSheetUrl: newUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sheet URL');
      }

      const result = await response.json();
      
      // Update team in local state
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, sheetUrl: newUrl.trim() } : team
      ));

      setSheetUrlSuccess(teamId);
      setTimeout(() => setSheetUrlSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating sheet URL:", err);
      // Revert local state on error
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, sheetUrl: editingSheetUrlValue } : team
      ));
      
      // Show error to user
      const errorMessage = err instanceof Error ? err.message : 'Failed to update sheet URL';
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingSheetUrl(null);
      setEditingSheetUrl(null);
      setEditingSheetUrlValue("");
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedTeams = await fetchAvailableTeams();
        const totalMembers = fetchedTeams.reduce(
          (acc, team) => acc + team.members.length,
          0
        );

        setStats({
          totalUsers: 0, // Will be updated when users are fetched
          totalTeams: fetchedTeams.length,
          totalCreators: totalMembers,
          systemStatus: "healthy",
        });

        // Also fetch users to get POD count for overview
        await fetchUsers();
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data from Google Sheets");
        setTeams([]);
        setStats({
          totalUsers: 0,
          totalTeams: 0,
          totalCreators: 0,
          systemStatus: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.some((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active")
      return (
        matchesSearch &&
        team.tasks.some((task) => task.status === "in-progress")
      );
    if (filterStatus === "completed")
      return (
        matchesSearch && team.tasks.every((task) => task.status === "completed")
      );

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-purple-700 dark:text-purple-300">
              Loading admin dashboard...
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Admin Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h2>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              Admin Only
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === "overview"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView("teams")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === "teams"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Team Management
            </button>
            <button
              onClick={() => {
                setActiveView("users");
                if (users.length === 0) fetchUsers();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === "users"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              User Management
            </button>
          </div>
        </div>

        {/* Overview View */}
        {activeView === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      POD Users
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
                      {teams.reduce(
                        (acc, team) => acc + team.members.length,
                        0
                      )}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div
                className={`p-4 rounded-lg border ${getStatusBgColor(stats.systemStatus)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      System Status
                    </p>
                    <p
                      className={`text-2xl font-bold capitalize ${getStatusColor(stats.systemStatus)}`}
                    >
                      {stats.systemStatus}
                    </p>
                  </div>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      stats.systemStatus === "healthy"
                        ? "bg-green-200 dark:bg-green-800"
                        : stats.systemStatus === "warning"
                          ? "bg-yellow-200 dark:bg-yellow-800"
                          : "bg-red-200 dark:bg-red-800"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full ${
                        stats.systemStatus === "healthy"
                          ? "bg-green-600"
                          : stats.systemStatus === "warning"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveView("teams")}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Manage Teams
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add, edit, or remove teams and members
                    </p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:shadow-lg transition-all duration-200 text-left">
                <div className="flex items-center space-x-3">
                  <Database className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      System Settings
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure system parameters
                    </p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:shadow-lg transition-all duration-200 text-left">
                <div className="flex items-center space-x-3">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      View Analytics
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      System usage and metrics
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Team Management View */}
        {activeView === "teams" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Team Management
                </h3>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                  {filteredTeams.length} teams
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() => setShowAddTeamForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Team</span>
                </button>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTeams.map((team) => {
                const stats = getTeamStats(team);

                return (
                  <div
                    key={team.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {editingTeamName === team.id ? (
                          <div className="flex items-center space-x-2 mb-1">
                            <input
                              type="text"
                              value={editingTeamNameValue}
                              onChange={(e) => setEditingTeamNameValue(e.target.value)}
                              className="text-lg font-semibold bg-transparent border-b-2 border-purple-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-600 flex-1"
                              placeholder="Team name"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateTeamName(team.id, editingTeamNameValue);
                                } else if (e.key === 'Escape') {
                                  setEditingTeamName(null);
                                  setEditingTeamNameValue("");
                                }
                              }}
                            />
                            <button
                              onClick={() => updateTeamName(team.id, editingTeamNameValue)}
                              disabled={updatingTeamName === team.id}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
                            >
                              {updatingTeamName === team.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingTeamName(null);
                                setEditingTeamNameValue("");
                              }}
                              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {team.name}
                            </h4>
                            <button
                              onClick={() => {
                                setEditingTeamName(team.id);
                                setEditingTeamNameValue(team.name);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="Edit team name"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {teamNameSuccess === team.id && (
                              <span className="text-green-600 dark:text-green-400 text-sm">✓ Updated</span>
                            )}
                          </div>
                        )}
                        
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {team.description}
                          </p>
                        )}

                        {/* Sheet URL Section */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          {editingSheetUrl === team.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current">
                                    <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM8 12h2v2H8v-2zm0-3h2v2H8V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9z"/>
                                  </svg>
                                </div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Google Sheet URL:
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={editingSheetUrlValue}
                                  onChange={(e) => setEditingSheetUrlValue(e.target.value)}
                                  className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 flex-1"
                                  placeholder="https://docs.google.com/spreadsheets/d/..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateSheetUrl(team.id, editingSheetUrlValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingSheetUrl(null);
                                      setEditingSheetUrlValue("");
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => updateSheetUrl(team.id, editingSheetUrlValue)}
                                  disabled={updatingSheetUrl === team.id}
                                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                  {updatingSheetUrl === team.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSheetUrl(null);
                                    setEditingSheetUrlValue("");
                                  }}
                                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Paste the full Google Sheets URL to create a smart chip link
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Link className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Google Sheet:
                              </span>
                              {team.sheetUrl ? (
                                <a
                                  href={team.sheetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group"
                                >
                                  {/* Google Sheets Icon */}
                                  <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current">
                                      <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM8 12h2v2H8v-2zm0-3h2v2H8V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9z"/>
                                    </svg>
                                  </div>
                                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                    Team Sheet
                                  </span>
                                  <ExternalLink className="h-3 w-3 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ) : (
                                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full">
                                  <div className="w-4 h-4 bg-gray-400 rounded-sm flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current">
                                      <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM8 12h2v2H8v-2zm0-3h2v2H8V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9zm3 3h2v2h-2v-2zm0-3h2v2h-2V9z"/>
                                    </svg>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    No sheet linked
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setEditingSheetUrl(team.id);
                                  setEditingSheetUrlValue(team.sheetUrl || "");
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Edit sheet URL"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              {sheetUrlSuccess === team.id && (
                                <span className="text-green-600 dark:text-green-400 text-xs animate-pulse">✓ Updated</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative team-menu-container">
                        <button 
                          onClick={() => setShowTeamMenu(showTeamMenu === team.id ? null : team.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {showTeamMenu === team.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                            <button
                              onClick={() => {
                                if (team.sheetUrl) {
                                  window.open(team.sheetUrl, '_blank');
                                }
                                setShowTeamMenu(null);
                              }}
                              disabled={!team.sheetUrl}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Open Sheet</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingTeamName(team.id);
                                setEditingTeamNameValue(team.name);
                                setShowTeamMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit Team Name</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingSheetUrl(team.id);
                                setEditingSheetUrlValue(team.sheetUrl || "");
                                setShowTeamMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Link className="h-4 w-4" />
                              <span>Edit Sheet URL</span>
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete team "${team.name}"?`)) {
                                  // TODO: Implement team deletion
                                  console.log('Delete team:', team.id);
                                }
                                setShowTeamMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete Team</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => setShowMembersModal(team.id)}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {team.members.length} Members
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowTasksModal(team.id)}
                        className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {stats.totalTasks} Tasks
                          </span>
                        </div>
                      </button>
                    </div>

                    {stats.totalTasks > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Progress
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(
                              (stats.completedTasks / stats.totalTasks) * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(stats.completedTasks / stats.totalTasks) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                            title={member.name}
                          >
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-gray-800">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {stats.overdueTasks > 0 && (
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {stats.overdueTasks}
                            </span>
                          </div>
                        )}
                        {stats.inProgressTasks > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {stats.inProgressTasks}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTeams.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery ? "No teams found" : "No teams yet"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery
                      ? `No teams match "${searchQuery}".`
                      : "Get started by creating your first team."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowAddTeamForm(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Team</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              {(() => {
                const team = teams.find(t => t.id === showMembersModal);
                if (!team) return null;
                
                return (
                  <>
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {team.name} - Team Members
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {team.members.length} members in this team
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Add Member Button */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowAddMemberDropdown(showAddMemberDropdown === team.id ? null : team.id);
                              if (!podUsers.length) fetchUsers();
                            }}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Member</span>
                          </button>
                          
                          {/* Add Member Dropdown */}
                          {showAddMemberDropdown === team.id && (
                            <div 
                              className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                              id="add-member-dropdown-container"
                            >
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Select POD User</h4>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {podUsers.length > 0 ? (
                                  podUsers
                                    .filter(user => !team.members.some(member => member.id === user.id))
                                    .map(user => (
                                    <button
                                      key={user.id}
                                      onClick={() => addMemberToTeam(team.id, user.id)}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                          {(user.name || 'Unknown User')
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .slice(0, 2)}
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'Unknown User'}</div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No POD users available
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setShowMembersModal(null)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                      {team.members.length > 0 ? (
                        <div className="space-y-4">
                          {team.members.map((member, index) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              {/* Member Avatar */}
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>

                              {/* Member Info */}
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {member.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {member.role}
                                </p>
                                {member.email && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {member.email}
                                  </p>
                                )}
                              </div>

                              {/* Role Badge or Role Editor */}
                              {editingMember === `${team.id}-${member.id}` ? (
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={member.role}
                                    onChange={(e) => updateMemberRole(team.id, member.id, e.target.value as Role)}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                  >
                                    <option value="POD">POD</option>
                                    <option value="USER">USER</option>
                                    <option value="GUEST">GUEST</option>
                                  </select>
                                  <button
                                    onClick={() => setEditingMember(null)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  member.role === 'POD' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    : member.role === 'USER'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {member.role}
                                </div>
                              )}

                              {/* Member Actions */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    if (member.email) {
                                      window.location.href = `mailto:${member.email}`;
                                    }
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  title="Send email"
                                  disabled={!member.email}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                
                                {/* Edit Role Button */}
                                <button
                                  onClick={() => setEditingMember(editingMember === `${team.id}-${member.id}` ? null : `${team.id}-${member.id}`)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  title="Edit role"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                
                                {/* Remove Member Button */}
                                <button
                                  onClick={() => removeMemberFromTeam(team.id, member.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  title="Remove from team"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No Members
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            This team doesn't have any members yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Team created from Google Sheets
                      </div>
                      <div className="flex items-center space-x-3">
                        {team.sheetUrl && (
                          <a
                            href={team.sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open Team Sheet</span>
                          </a>
                        )}
                        <button
                          onClick={() => setShowMembersModal(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tasks Modal */}
        {showTasksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              {(() => {
                const team = teams.find(t => t.id === showTasksModal);
                if (!team) return null;
                
                return (
                  <>
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {team.name} - Team Tasks
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {team.tasks.length} tasks in this team
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Add Task Button */}
                        <button
                          onClick={() => {
                            setShowAddTaskForm(showAddTaskForm === team.id ? null : team.id);
                            if (!podUsers.length) fetchUsers();
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Task</span>
                        </button>
                        
                        <button
                          onClick={() => setShowTasksModal(null)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Add Task Form */}
                    {showAddTaskForm === team.id && (
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add New Task</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Task Title *
                            </label>
                            <input
                              type="text"
                              value={newTaskData.title}
                              onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              placeholder="Enter task title..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Priority
                            </label>
                            <select
                              value={newTaskData.priority}
                              onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value as 'low' | 'medium' | 'high'})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Assign To
                            </label>
                            <select
                              value={newTaskData.assignedTo}
                              onChange={(e) => setNewTaskData({...newTaskData, assignedTo: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Unassigned</option>
                              {team.members.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={newTaskData.dueDate}
                              onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </label>
                            <textarea
                              value={newTaskData.description}
                              onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              rows={3}
                              placeholder="Enter task description..."
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-4">
                          <button
                            onClick={() => setShowAddTaskForm(null)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => addTaskToTeam(team.id)}
                            disabled={!newTaskData.title.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                      {team.tasks.length > 0 ? (
                        <div className="space-y-3">
                          {team.tasks.map((task, index) => (
                            <div
                              key={task.id}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start space-x-4">
                                {/* Task Status Selector */}
                                <div className="flex-shrink-0">
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(team.id, task.id, e.target.value as 'not-started' | 'in-progress' | 'completed' | 'on-hold')}
                                    className={`w-28 px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                                      task.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : task.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        : task.status === 'on-hold'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                    }`}
                                  >
                                    <option value="not-started">Not Started</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>

                                {/* Task Info */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {task.title}
                                      </h4>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* Task Priority Badge */}
                                    <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                                      task.priority === 'high'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        : task.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    }`}>
                                      {task.priority}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      {/* Assignee Selector */}
                                      {editingTask === task.id ? (
                                        <div className="flex items-center space-x-2">
                                          <select
                                            value={task.assignedTo}
                                            onChange={(e) => updateTaskAssignment(team.id, task.id, e.target.value)}
                                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                          >
                                            <option value="">Unassigned</option>
                                            {team.members.map(member => (
                                              <option key={member.id} value={member.id}>
                                                {member.name}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => setEditingTask(null)}
                                            className="p-1 text-green-600 hover:text-green-800"
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          {task.assignedTo ? (
                                            <div className="flex items-center space-x-2">
                                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                                {(team.members.find(m => m.id === task.assignedTo)?.name || 'U')
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")
                                                  .slice(0, 2)}
                                              </div>
                                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {team.members.find(m => m.id === task.assignedTo)?.name || 'Unknown'}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Unassigned</span>
                                          )}
                                          <button
                                            onClick={() => setEditingTask(task.id)}
                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Edit assignment"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}

                                      {task.dueDate && (
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Task Actions */}
                                    <button
                                      onClick={() => removeTaskFromTeam(team.id, task.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                                      title="Remove task"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No Tasks
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            This team doesn't have any tasks yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Team tasks from Google Sheets
                      </div>
                      <div className="flex items-center space-x-3">
                        {team.sheetUrl && (
                          <a
                            href={team.sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open Team Sheet</span>
                          </a>
                        )}
                        <button
                          onClick={() => setShowTasksModal(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* User Management View */}
        {activeView === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h3>
              <button
                onClick={fetchUsers}
                disabled={isUsersLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>{isUsersLoading ? "Loading..." : "Refresh Users"}</span>
              </button>
            </div>

            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Filter by role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as "all" | "POD" | "USER" | "GUEST")}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="POD">POD</option>
                      <option value="USER">USER</option>
                      <option value="GUEST">GUEST</option>
                    </select>
                  </div>
                  {(userSearchQuery || userRoleFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setUserSearchQuery("");
                        setUserRoleFilter("all");
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Clear filters"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Results Count */}
              {!isUsersLoading && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {users.filter((user) => {
                      const matchesSearch = userSearchQuery === "" || 
                        user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.role.toLowerCase().includes(userSearchQuery.toLowerCase());
                      const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
                      return matchesSearch && matchesRole;
                    }).length} of {users.length} users
                    {(userSearchQuery || userRoleFilter !== 'all') && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        (filtered)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {isUsersLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {!isUsersLoading && (() => {
              const filteredUsers = users.filter((user) => {
                // Filter by search query
                const matchesSearch = userSearchQuery === "" || 
                  user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  user.role.toLowerCase().includes(userSearchQuery.toLowerCase());
                
                // Filter by role
                const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
                
                return matchesSearch && matchesRole;
              });

              if (filteredUsers.length === 0 && (userSearchQuery || userRoleFilter !== "all")) {
                return (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No users match your search
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <button
                      onClick={() => {
                        setUserSearchQuery("");
                        setUserRoleFilter("all");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user) => (
                    <UserRoleCard
                      key={user.id}
                      user={user}
                      onRoleUpdate={async (userId: string, newRole: string) => {
                        await updateUserRole(userId, newRole as Role);
                        setUsers((prev) =>
                          prev.map((u) =>
                            u.id === userId ? { ...u, role: newRole } : u
                          )
                        );
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            {!isUsersLoading && users.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No users found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try refreshing to load users.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// User Role Card Component
interface UserRoleCardProps {
  user: SystemUser;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
}

const UserRoleCard: React.FC<UserRoleCardProps> = ({ user, onRoleUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "POD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-500/30";
      case "USER":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-500/30";
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-500/30";
      case "GUEST":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "POD":
        return <Settings className="h-4 w-4" />;
      case "USER":
        return <User className="h-4 w-4" />;
      case "ADMIN":
        return <Shield className="h-4 w-4" />;
      case "GUEST":
        return <User className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const handleRoleUpdate = async (newRole: string) => {
    if (newRole === user.role) return;

    setIsUpdating(true);
    try {
      await onRoleUpdate(user.id, newRole);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      {/* User Info */}
      <div className="flex items-center space-x-4 mb-4">
        {user.image ? (
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
            alt={user.name || ""}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {user.name || "No Name"}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-4">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getRoleColor(user.role)}`}
        >
          {getRoleIcon(user.role)}
          <span className="font-medium">{user.role}</span>
          {showSuccess && (
            <span className="text-green-600 dark:text-green-400">✓</span>
          )}
        </div>
      </div>

      {/* Role Toggle Buttons */}
      {(user.role === "USER" ||
        user.role === "POD" ||
        user.role === "GUEST") && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRoleUpdate("USER")}
              disabled={isUpdating || user.role === "USER"}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                user.role === "USER"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300"
              }`}
            >
              <User className="h-4 w-4" />
              <span>USER</span>
            </button>

            <button
              onClick={() => handleRoleUpdate("POD")}
              disabled={isUpdating || user.role === "POD"}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                user.role === "POD"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>POD</span>
            </button>
          </div>

          {isUpdating && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Updating...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Role Notice */}
      {user.role === "ADMIN" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">
              Admin role cannot be changed
            </span>
          </div>
        </div>
      )}

      {/* User Details */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          <span>ID: {user.id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};

export default PodAdminDashboard;
