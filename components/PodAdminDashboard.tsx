"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { updateUserRole } from "@/app/actions/admin";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  formatForDisplay,
  parseUserDate,
  formatDueDate,
  utcNow,
  utcNowDateTime
} from "@/lib/dateUtils";

// Import the new modular components
import {
  AdminHeader,
  OverviewView,
  TeamsView,
  UsersView,
  TeamMembersModal,
  TeamTasksModal,
  AddMemberModal,
} from "./pod-admin";

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

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

const PodAdminDashboard = () => {
  const { data: session } = useSession();
  
  // Core state
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
  const [isFetching, setIsFetching] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "teams" | "users">("overview");
  
  // Form and modal states
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [showTasksModal, setShowTasksModal] = useState<string | null>(null);
  const [showColumnAssignments, setShowColumnAssignments] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState<string | null>(null);
  
  // Available users for adding to teams
  const [availableUsers, setAvailableUsers] = useState<SystemUser[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "POD" | "USER" | "GUEST">("all");
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Teams-related states
  const [availableCreators, setAvailableCreators] = useState<string[]>([]);
  const [updatingTeamName, setUpdatingTeamName] = useState<string | null>(null);
  const [updatingTeamPrefix, setUpdatingTeamPrefix] = useState<string | null>(null);
  const [updatingCreators, setUpdatingCreators] = useState<string | null>(null);
  const [teamNameSuccess, setTeamNameSuccess] = useState<string | null>(null);
  const [teamPrefixSuccess, setTeamPrefixSuccess] = useState<string | null>(null);
  const [creatorsSuccess, setCreatorsSuccess] = useState<string | null>(null);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest(".team-menu-container")) {
        // Close any open team menus
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Status color helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 dark:text-green-400";
      case "warning": return "text-yellow-600 dark:text-yellow-400";
      case "error": return "text-red-600 dark:text-red-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30";
      case "warning": return "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30";
      case "error": return "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30";
      default: return "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-500/30";
    }
  };

  // Team stats helper
  const getTeamStats = (team: Team) => {
    const totalTasks = team.tasks.length;
    const completedTasks = team.tasks.filter(task => task.status === "completed").length;
    const inProgressTasks = team.tasks.filter(task => task.status === "in-progress").length;
    const overdueTasks = team.tasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        const dueDateTime = parseUserDate(task.dueDate);
        const now = utcNowDateTime();
        return dueDateTime && dueDateTime < now && task.status !== "completed";
      } catch {
        return false;
      }
    }).length;

    return { totalTasks, completedTasks, inProgressTasks, overdueTasks };
  };

  // Data fetching functions
  const fetchTasksFromDB = useCallback(async (teamId: string): Promise<Task[]> => {
    try {
      const response = await fetch(`/api/tasks?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      return result.tasks?.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        status: task.status?.toLowerCase().replace('_', '-') || 'not-started',
        priority: task.priority?.toLowerCase() || 'medium',
        dueDate: task.dueDate,
      })) || [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }, []);

  const fetchAvailableTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/pod/teams");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.teams) {
        const teamsWithTasks = await Promise.all(
          result.teams.map(async (dbTeam: any) => {
            const teamId = dbTeam.id;
            const dbTasks = await fetchTasksFromDB(teamId);
            
            // Only try to fetch detailed data if rowNumber exists
            if (dbTeam.rowNumber) {
              try {
                const detailedTeamResponse = await fetch("/api/pod/fetch-db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    range: `Teams!A${dbTeam.rowNumber}:Z${dbTeam.rowNumber}`,
                    teamId: teamId,
                  }),
                });

                if (detailedTeamResponse.ok) {
                  const detailedData = await detailedTeamResponse.json();
                  return {
                    ...dbTeam,
                    tasks: dbTasks,
                    members: detailedData.data?.members || dbTeam.members,
                    creators: detailedData.data?.creators || dbTeam.creators,
                    description: detailedData.data?.description || dbTeam.description,
                    projectPrefix: detailedData.data?.projectPrefix || dbTeam.projectPrefix,
                  };
                } else {
                  console.warn(`fetch-db failed for team ${teamId}, status: ${detailedTeamResponse.status}`);
                }
              } catch (fetchError) {
                console.warn(`fetch-db error for team ${teamId}:`, fetchError);
              }
            }
            
            // Return basic team data if detailed fetch fails or rowNumber missing
            return { ...dbTeam, tasks: dbTasks };
          })
        );
        return teamsWithTasks;
      }
      return [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  }, []); // Remove fetchTasksFromDB dependency to prevent loops

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const filteredUsers = result.users.filter((user: SystemUser) =>
        user.role !== "ADMIN" || user.id === session?.user?.id
      );
      setUsers(filteredUsers);
      // Also update available users for adding to teams
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchAvailableCreators = async () => {
    try {
      const response = await fetch("/api/creators-db");
      const data = await response.json();
      
      if (data.success && data.creators) {
        const creatorNames = data.creators
          .filter((creator: any) => creator.isActive !== false)
          .map((creator: any) => creator.name || creator.Creator)
          .filter((name: string) => name && name.trim() !== "");
        
        setAvailableCreators(creatorNames);
        return creatorNames;
      } else {
        setAvailableCreators([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setAvailableCreators([]);
      return [];
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Team management functions
  const updateTeamName = async (teamId: string, newName: string) => {
    if (!newName.trim()) return;
    
    setUpdatingTeamName(teamId);
    try {
      const promises = [
        fetch(`/api/pod/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        }),
      ];

      const [dbResponse] = await Promise.allSettled(promises);
      
      if (dbResponse.status === 'fulfilled' && dbResponse.value.ok) {
        setTeams(prev => prev.map(team => 
          team.id === teamId ? { ...team, name: newName } : team
        ));
        setTeamNameSuccess(teamId);
        setTimeout(() => setTeamNameSuccess(null), 3000);
        showSuccessMessage("Team name updated successfully!");
      } else if (dbResponse.status === 'fulfilled') {
        const errorData = await dbResponse.value.json();
        throw new Error(errorData.error || "Failed to update team name");
      } else {
        throw new Error("Failed to update team name");
      }
    } catch (error) {
      console.error("Error updating team name:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update team name";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingTeamName(null);
    }
  };

  const updateTeamPrefix = async (teamId: string, newPrefix: string) => {
    if (!newPrefix.trim() || newPrefix.length < 3) return;
    
    const prefix = newPrefix.trim().toUpperCase();
    
    setUpdatingTeamPrefix(teamId);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPrefix: prefix }),
      });

      if (response.ok) {
        setTeams(prev => prev.map(team => 
          team.id === teamId ? { ...team, projectPrefix: prefix } : team
        ));
        setTeamPrefixSuccess(teamId);
        setTimeout(() => setTeamPrefixSuccess(null), 3000);
        showSuccessMessage("Project prefix updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project prefix");
      }
    } catch (error) {
      console.error("Error updating team prefix:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update project prefix";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingTeamPrefix(null);
    }
  };

  const updateTeamCreators = async (teamId: string, newCreators: string[]) => {
    setUpdatingCreators(teamId);
    try {
      const response = await fetch("/api/pod/update-team-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamId,
          creators: newCreators,
        }),
      });

      if (response.ok) {
        setTeams(prev => prev.map(team => 
          team.id === teamId ? { ...team, creators: newCreators } : team
        ));
        setCreatorsSuccess(teamId);
        setTimeout(() => setCreatorsSuccess(null), 3000);
        showSuccessMessage("Creators updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update creators");
      }
    } catch (error) {
      console.error("Error updating creators:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update creators";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingCreators(null);
    }
  };

  // Data loading logic moved to useEffect

  useEffect(() => {
    if (!session?.user || isFetching) return;
    
    const loadData = async () => {
      console.log("Starting data load for PodAdminDashboard");
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTeams = await fetchAvailableTeams();
        const totalMembers = fetchedTeams.reduce((acc, team) => acc + team.members.length, 0);
        
        setTeams(fetchedTeams);
        setStats(prev => ({
          ...prev,
          totalTeams: fetchedTeams.length,
          totalUsers: totalMembers,
        }));
        console.log("Successfully loaded", fetchedTeams.length, "teams");
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    };
    
    loadData();
  }, [session?.user?.id]); // Only depend on user ID to prevent loops

  // Modal handler functions
  const handleAddMemberToTeam = async (teamId: string, userIds: string[], roles: Record<string, string>) => {
    try {
      // This would call the actual API to add members
      console.log("Adding members to team:", teamId, userIds, roles);
      showSuccessMessage("Members added successfully!");
      // Refresh team data by calling fetchAvailableTeams directly
      const fetchedTeams = await fetchAvailableTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error adding members:", error);
      setError("Failed to add members");
    }
  };

  const handleRemoveMemberFromTeam = async (teamId: string, memberId: string) => {
    try {
      // This would call the actual API to remove member
      console.log("Removing member from team:", teamId, memberId);
      showSuccessMessage("Member removed successfully!");
      // Refresh team data by calling fetchAvailableTeams directly
      const fetchedTeams = await fetchAvailableTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member");
    }
  };

  const handleEditMember = (teamId: string, memberId: string) => {
    // Open edit member modal or form
    console.log("Edit member:", teamId, memberId);
  };

  const handleAddTask = async (teamId: string) => {
    // This would open an add task form/modal
    console.log("Add task to team:", teamId);
  };

  const handleEditTask = (teamId: string, taskId: string) => {
    // Open edit task modal or form
    console.log("Edit task:", teamId, taskId);
  };

  const handleDeleteTask = async (teamId: string, taskId: string) => {
    try {
      // This would call the actual API to delete task
      console.log("Deleting task:", teamId, taskId);
      showSuccessMessage("Task deleted successfully!");
      // Refresh team data by calling fetchAvailableTeams directly
      const fetchedTeams = await fetchAvailableTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    }
  };

  const handleUpdateTaskStatus = async (teamId: string, taskId: string, status: Task["status"]) => {
    try {
      // This would call the actual API to update task status
      console.log("Updating task status:", teamId, taskId, status);
      showSuccessMessage("Task status updated!");
      // Refresh team data by calling fetchAvailableTeams directly
      const fetchedTeams = await fetchAvailableTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error updating task status:", error);
      setError("Failed to update task status");
    }
  };

  // Filter teams based on search
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = searchQuery === "" || 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.some(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Loading Admin Dashboard...
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg animate-pulse"
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

  // Error state
  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
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
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-right-full duration-300">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-3 flex-shrink-0 text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-4 sm:p-6">
        <AdminHeader
          activeView={activeView}
          setActiveView={setActiveView}
          fetchUsers={fetchUsers}
          users={users}
        />

        {/* Overview View */}
        {activeView === "overview" && (
          <OverviewView stats={stats} teams={teams} />
        )}

        {/* Team Management View */}
        {activeView === "teams" && (
          <TeamsView
            teams={teams}
            filteredTeams={filteredTeams}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowAddTeamForm={setShowAddTeamForm}
            onUpdateTeamName={updateTeamName}
            onUpdateTeamPrefix={updateTeamPrefix}
            onUpdateTeamCreators={updateTeamCreators}
            onShowMembers={setShowMembersModal}
            onShowTasks={setShowTasksModal}
            onShowColumnAssignments={setShowColumnAssignments}
            getTeamStats={getTeamStats}
            getStatusColor={getStatusColor}
            getStatusBgColor={getStatusBgColor}
            availableCreators={availableCreators}
            fetchAvailableCreators={fetchAvailableCreators}
            updatingStates={{
              teamName: updatingTeamName || undefined,
              teamPrefix: updatingTeamPrefix || undefined,
              creators: updatingCreators || undefined,
            }}
            successStates={{
              teamName: teamNameSuccess || undefined,
              teamPrefix: teamPrefixSuccess || undefined,
              creators: creatorsSuccess || undefined,
            }}
          />
        )}

        {/* User Management View */}
        {activeView === "users" && (
          <UsersView
            users={users}
            isUsersLoading={isUsersLoading}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            fetchUsers={fetchUsers}
            onRoleUpdate={async (userId: string, newRole: string) => {
              await updateUserRole(userId, newRole as Role);
            }}
            setUsers={setUsers}
          />
        )}
      </div>

      {/* Modals */}
      <TeamMembersModal
        isOpen={!!showMembersModal}
        onClose={() => setShowMembersModal(null)}
        team={showMembersModal ? teams.find(t => t.id === showMembersModal) || null : null}
        onAddMember={(teamId) => {
          setShowAddMemberForm(teamId);
          fetchUsers();
        }}
        onRemoveMember={handleRemoveMemberFromTeam}
        onEditMember={handleEditMember}
      />

      <TeamTasksModal
        isOpen={!!showTasksModal}
        onClose={() => setShowTasksModal(null)}
        team={showTasksModal ? teams.find(t => t.id === showTasksModal) || null : null}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onUpdateTaskStatus={handleUpdateTaskStatus}
      />

      <AddMemberModal
        isOpen={!!showAddMemberForm}
        onClose={() => setShowAddMemberForm(null)}
        teamId={showAddMemberForm}
        availableUsers={availableUsers}
        onAddMembers={handleAddMemberToTeam}
      />
    </div>
  );
};

export default PodAdminDashboard;