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
  Edit2,
  UserMinus,
  Check,
  AlertTriangle,
  Target,
  Bell,
} from "lucide-react";
import { updateUserRole } from "@/app/actions/admin";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";

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
  userId?: string; // The actual User ID for database operations
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
  creators?: string[];
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
  const { data: session } = useSession();
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
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "POD" | "USER" | "GUEST"
>("all");
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
  const [showTeamMenu, setShowTeamMenu] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [showTasksModal, setShowTasksModal] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [podUsers, setPodUsers] = useState<SystemUser[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState<string | null>(null);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState<{
    teamId: string;
    memberId: string;
    memberName: string;
    teamName: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedTo: "",
    dueDate: "",
  });
  const [hasDueDate, setHasDueDate] = useState(false);

  // Creator management state
  const [editingCreators, setEditingCreators] = useState<string | null>(null);
  const [editingCreatorsValue, setEditingCreatorsValue] = useState<string[]>(
    []
  );
  const [updatingCreators, setUpdatingCreators] = useState<string | null>(null);
  const [creatorsSuccess, setCreatorsSuccess] = useState<string | null>(null);
  const [availableCreators, setAvailableCreators] = useState<string[]>([]);

  // Column assignments state
  const [showColumnAssignments, setShowColumnAssignments] = useState<string | null>(null);
  const [teamColumns, setTeamColumns] = useState<any[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [showAssignMemberModal, setShowAssignMemberModal] = useState<{
    columnId: string;
    columnLabel: string;
    teamId: string;
  } | null>(null);
  const [assigningMember, setAssigningMember] = useState(false);


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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown, showTeamMenu]);

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
      // Use the new teams API that works with relational schema
      const response = await fetch("/api/pod/teams");

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔄 New schema teams response:', result);

      if (result.success && result.teams) {
        const apiTeams: Team[] = await Promise.all(
          result.teams.map(async (dbTeam: any) => {
            const teamId = dbTeam.id; // Use actual team ID instead of row-based ID
            const dbTasks = await fetchTasksFromDB(teamId);

            // Fetch detailed team data including members and clients
            const detailedTeamResponse = await fetch("/api/pod/fetch-db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rowId: teamId }),
            });

            let teamMembers: TeamMember[] = [];
            let teamCreators: string[] = [];
            let sheetUrl = "";

            if (detailedTeamResponse.ok) {
              const detailedData = await detailedTeamResponse.json();
              if (detailedData.success && detailedData.data) {
                teamMembers = detailedData.data.teamMembers || [];
                teamCreators = detailedData.data.creators?.map((c: any) => c.name) || [];
                sheetUrl = detailedData.data.sheetLinks?.[0]?.url || "";
              }
            }

            return {
              id: teamId,
              name: dbTeam.name,
              description: dbTeam.description || `Team: ${dbTeam.name}`,
              members: teamMembers,
              tasks: dbTasks,
              sheetUrl,
              rowNumber: 0, // No longer using row numbers
              creators: teamCreators,
            };
          })
        );
        
        console.log('📊 Parsed teams with new schema:', apiTeams.map(t => ({ 
          id: t.id,
          name: t.name, 
          memberCount: t.members.length, 
          creators: t.creators
        })));
        
        setTeams(apiTeams);
        setStats({
          totalUsers: users.length,
          totalTeams: apiTeams.length,
          totalCreators: [...new Set(apiTeams.flatMap(t => t.creators))].length,
          systemStatus: "healthy",
        });
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
      const response = await fetch("/api/pod/fetch-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowId: rowNumber,
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

        // Tasks are now loaded from database via fetchTasksFromDB in fetchAvailableTeams
        const tasks: Task[] = [];

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

  // Fetch tasks from database
  const fetchTasksFromDB = async (teamId: string): Promise<Task[]> => {
    try {
      const response = await fetch(`/api/tasks?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const result = await response.json();
      if (result.success && result.tasks) {
        return result.tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          status: task.status.toLowerCase().replace("_", "-") as
            | "not-started"
            | "in-progress"
            | "completed"
            | "on-hold",
          priority: task.priority.toLowerCase() as "low" | "medium" | "high",
          assignedTo: task.assignedTo || "",
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().split("T")[0]
            : "",
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };

  // Refresh tasks for a specific team
  const refreshTeamTasks = async (teamId: string) => {
    try {
      const dbTasks = await fetchTasksFromDB(teamId);
      setTeams(
        teams.map((t) => (t.id === teamId ? { ...t, tasks: dbTasks } : t))
      );
    } catch (error) {
      console.error("Error refreshing team tasks:", error);
    }
  };

  // Show success message with auto-dismiss
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000); // Auto-dismiss after 3 seconds
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
      const podOnlyUsers = result.users.filter(
        (user: SystemUser) => user.role === "POD"
      );

      setUsers(filteredUsers);
      setPodUsers(podOnlyUsers);

      // Update stats with POD users count
      setStats((prevStats) => ({
        ...prevStats,
        totalUsers: podOnlyUsers.length,
      }));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Member management functions
  const addMemberToTeam = async (
    teamId: string,
    data: { userId: string; role: string; userEmail?: string; userName?: string }
  ) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Try to find user by email first (more reliable), then by ID
      let user = podUsers.find((u) => u.email === data.userEmail);
      if (!user) {
        user = podUsers.find((u) => u.id === data.userId);
        console.warn('User not found by email, falling back to ID lookup:', { 
          searchEmail: data.userEmail, 
          foundUser: user ? { id: user.id, email: user.email, name: user.name } : null 
        });
      } else {
        console.log('User found by email:', { 
          searchEmail: data.userEmail, 
          foundUser: { id: user.id, email: user.email, name: user.name } 
        });
      }
      
      if (!user || !user.email) {
        console.error('User not found or missing email:', { userId: data.userId, userEmail: data.userEmail });
        alert(`Error: Could not find user with email ${data.userEmail} or ID ${data.userId}`);
        return;
      }

      const newMember = {
        id: user.id,
        name: user.name || data.userName || "Unknown User",
        email: user.email,
        role: data.role as any, // Use the provided role instead of user.role
      };

      const updatedMembers = [...team.members, newMember];

      // Update team in local state first
      setTeams(
        teams.map((t) =>
          t.id === teamId ? { ...t, members: updatedMembers } : t
        )
      );

      // Update database
      const promises = [
        // Database update (primary)
        fetch("/api/pod/update-team-members-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId,
            members: updatedMembers,
          }),
        }),
      ];

      const [dbResponse] = await Promise.allSettled(promises);

      // Check database result (critical)
      if (dbResponse.status === "rejected") {
        alert("Member added locally, but failed to sync with database");
        console.error("Error syncing with database:", dbResponse.reason);
      } else if (dbResponse.value && !dbResponse.value.ok) {
        const errorData = await dbResponse.value.json();
        alert(`Member added locally, but failed to sync with database: ${errorData.error}`);
      } else {
        console.log("Successfully synced team members with database");
      }


      setShowAddMemberForm(null);
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member to team");
    }
  };

  // Add multiple members to team at once
  const addMultipleMembersToTeam = async (
    teamId: string,
    users: { userId: string; role: string; userEmail?: string; userName?: string }[]
  ) => {
    console.log('🔍 addMultipleMembersToTeam - Received data:', { teamId, users });
    console.log('🔍 addMultipleMembersToTeam - Current podUsers:', podUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      const newMembers = users
        .map((userData) => {
          console.log('🔍 Processing user data:', userData);
          
          // Try to find user by email first (more reliable), then by ID
          let user = podUsers.find((u) => u.email === userData.userEmail);
          if (!user) {
            user = podUsers.find((u) => u.id === userData.userId);
            console.warn('User not found by email, falling back to ID lookup:', { 
              searchEmail: userData.userEmail, 
              searchId: userData.userId,
              foundUser: user ? { id: user.id, email: user.email, name: user.name } : null 
            });
          } else {
            console.log('User found by email:', { 
              searchEmail: userData.userEmail, 
              foundUser: { id: user.id, email: user.email, name: user.name } 
            });
          }
          
          if (!user || !user.email) {
            console.error('User not found or missing email:', { userId: userData.userId, userEmail: userData.userEmail });
            return null;
          }

          const newMember = {
            id: user.id,
            name: user.name || userData.userName || "Unknown User",
            email: user.email,
            role: userData.role as any,
          };
          
          console.log('🔍 Created new member object:', newMember);
          return newMember;
        })
        .filter(
          (member): member is NonNullable<typeof member> => member !== null
        ); // Type guard to remove nulls

      console.log('🔍 addMultipleMembersToTeam - Final newMembers:', newMembers);

      if (newMembers.length === 0) {
        alert("No valid users found to add. Users must have email addresses.");
        return;
      }

      console.log('🔍 addMultipleMembersToTeam - Team before update:', team.members.map(m => ({ id: m.id, email: m.email, name: m.name })));

      const updatedMembers = [...team.members, ...newMembers];

      console.log('🔍 addMultipleMembersToTeam - Updated members to send to API:', updatedMembers.map(m => ({ id: m.id, email: m.email, name: m.name })));

      // Update team in local state first
      setTeams(
        teams.map((t) =>
          t.id === teamId ? { ...t, members: updatedMembers } : t
        )
      );

      // Update database
      try {
        const dbResponse = await fetch("/api/pod/update-team-members-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId,
            members: updatedMembers,
          }),
        });

        console.log('🔍 addMultipleMembersToTeam - API request sent:', {
          teamId,
          members: updatedMembers.map(m => ({ id: m.id, email: m.email, name: m.name }))
        });

        if (!dbResponse.ok) {
          const errorData = await dbResponse.json();
          console.error("Failed to update database:", errorData.error);
          alert(`Members added locally, but failed to sync with database: ${errorData.error}`);
        } else {
          console.log("Successfully synced team members with database");
        }
      } catch (dbError) {
        console.error("Error syncing with database:", dbError);
        alert("Members added locally, but failed to sync with database");
      }


      setShowAddMemberForm(null);
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Failed to add members to team");
    }
  };

  const removeMemberFromTeam = async (teamId: string, memberId: string) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      const updatedMembers = team.members.filter((m) => m.id !== memberId);

      // Update team in local state first
      setTeams(
        teams.map((t) =>
          t.id === teamId ? { ...t, members: updatedMembers } : t
        )
      );

      // Update database
      try {
        const dbResponse = await fetch("/api/pod/update-team-members-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId,
            members: updatedMembers,
          }),
        });

        if (!dbResponse.ok) {
          const errorData = await dbResponse.json();
          console.error("Failed to update database:", errorData.error);
          alert(`Member removed locally, but failed to sync with database: ${errorData.error}`);
        } else {
          console.log("Successfully synced team members with database");
        }
      } catch (dbError) {
        console.error("Error syncing with database:", dbError);
        alert("Member removed locally, but failed to sync with database");
      }

    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member from team");
    }
  };

  const updateMemberRole = async (
    teamId: string,
    memberId: string,
    newRole: string
  ) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Update member role in local state
      const updatedMembers = team.members.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      );

      setTeams(
        teams.map((t) =>
          t.id === teamId ? { ...t, members: updatedMembers } : t
        )
      );

      // Update database
      try {
        const dbResponse = await fetch("/api/pod/update-team-members-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId,
            members: updatedMembers,
          }),
        });

        if (!dbResponse.ok) {
          const errorData = await dbResponse.json();
          console.error("Failed to update database:", errorData.error);
          alert(`Member role updated locally, but failed to sync with database: ${errorData.error}`);
        } else {
          console.log("Successfully synced team members with database");
        }
      } catch (dbError) {
        console.error("Error syncing with database:", dbError);
        alert("Member role updated locally, but failed to sync with database");
      }


      setEditingMember(null);
    } catch (error) {
      console.error("Error updating member role:", error);
      alert("Failed to update member role");
    }
  };

  // Creator management functions
  const fetchAvailableCreators = async () => {
    try {
      const response = await fetch("/api/creators-db");
      const data = await response.json();
      
      console.log('Full API response (main):', data);
      console.log('data.creators type:', typeof data.creators);
      console.log('Is creators array:', Array.isArray(data.creators));

      if (Array.isArray(data.creators)) {
        console.log('Raw creators data from API:', data.creators);
        
        // Extract creator names from database
        const creatorNames = data.creators
          .map((creator: any) => creator.name?.trim())
          .filter(
            (name: string, index: number, array: string[]) =>
              name && name.length > 0 && array.indexOf(name) === index
          )
          .sort();
          
        console.log('Processed creator names:', creatorNames);
        setAvailableCreators(creatorNames);
      } else {
        console.error(
          "Failed to fetch creators from database:",
          data.error || "No creators array in response"
        );
        console.error("Actual response data:", data);
        setAvailableCreators([]);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setAvailableCreators([]);
    }
  };

  const updateTeamCreators = async (teamId: string, newCreators: string[]) => {
    setUpdatingCreators(teamId);
    try {

      // Call the API to update the database with new creators
      const response = await fetch("/api/pod/update-team-creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: teamId,
          creatorNames: newCreators,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team creators");
      }

      // Update team in local state
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId ? { ...team, creators: newCreators } : team
        )
      );

      setCreatorsSuccess(teamId);
      setTimeout(() => setCreatorsSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating team creators:", err);
      // Revert local state on error
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, creators: editingCreatorsValue }
            : team
        )
      );

      // Show error to user
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update team creators";
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingCreators(null);
      setEditingCreators(null);
      setEditingCreatorsValue([]);
    }
  };

  // Task management functions
  const addTaskToTeam = async (teamId: string) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team || !newTaskData.title.trim()) return;

      // Create task in database
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTaskData.title.trim(),
          description: newTaskData.description.trim() || null,
          priority: newTaskData.priority.toUpperCase(),
          assignedTo: newTaskData.assignedTo || null,
          dueDate: newTaskData.dueDate || null,
          teamId,
          teamName: team.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const result = await response.json();

      if (result.success && result.task) {
        // Convert database task to local format
        const newTask: Task = {
          id: result.task.id,
          title: result.task.title,
          description: result.task.description || "",
          status: result.task.status.toLowerCase().replace("_", "-") as
            | "not-started"
            | "in-progress"
            | "completed"
            | "on-hold",
          priority: result.task.priority.toLowerCase() as
            | "low"
            | "medium"
            | "high",
          assignedTo: result.task.assignedTo || "",
          dueDate: result.task.dueDate
            ? new Date(result.task.dueDate).toISOString().split("T")[0]
            : "",
        };

        // Refresh tasks from database to ensure consistency
        await refreshTeamTasks(teamId);

        // Show success message
        showSuccessMessage(`Task "${newTaskData.title}" created successfully!`);

        // Reset form
        setNewTaskData({
          title: "",
          description: "",
          priority: "medium",
          assignedTo: "",
          dueDate: "",
        });
        setHasDueDate(false);
        setShowAddTaskForm(null);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task to team");
    }
  };

  const removeTaskFromTeam = async (teamId: string, taskId: string) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Delete task from database
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh tasks from database to ensure consistency
        await refreshTeamTasks(teamId);
        showSuccessMessage("Task deleted successfully!");
      }
    } catch (error) {
      console.error("Error removing task:", error);
      alert("Failed to remove task from team");
    }
  };

  const updateTaskStatus = async (
    teamId: string,
    taskId: string,
    newStatus: "not-started" | "in-progress" | "completed" | "on-hold"
  ) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Convert status to database format
      const dbStatus = newStatus.toUpperCase().replace("-", "_");

      // Update task in database
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          status: dbStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh tasks from database to ensure consistency
        await refreshTeamTasks(teamId);
        showSuccessMessage(
          `Task status updated to "${newStatus.replace("-", " ")}"!`
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  const updateTaskAssignment = async (
    teamId: string,
    taskId: string,
    newAssignee: string
  ) => {
    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      // Convert member ID to email for database storage
      const member = team.members.find((m) => m.id === newAssignee);
      const assigneeEmail = member?.email || newAssignee;

      // Update task in database
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          assignedTo: assigneeEmail || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task assignment");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh tasks from database to ensure consistency
        await refreshTeamTasks(teamId);
        const member = team.members.find((m) => m.id === newAssignee);
        const assigneeName =
          member?.name || (newAssignee ? "assigned user" : "unassigned");
        showSuccessMessage(`Task assigned to ${assigneeName}!`);
      }

      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task assignment:", error);
      alert("Failed to update task assignment");
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
      const podOnlyUsers = result.users.filter(
        (user: SystemUser) => user.role === "POD"
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
      // Update database
      const promises = [
        // Database update (primary)
        fetch("/api/pod/update-team-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: teamId,
            newTeamName: newName.trim(),
          }),
        }),
      ];

      const [dbResponse] = await Promise.allSettled(promises);

      // Check database result (critical)
      if (dbResponse.status === "rejected") {
        throw new Error("Failed to update team name in database");
      }
      if (dbResponse.value && !dbResponse.value.ok) {
        const errorData = await dbResponse.value.json();
        throw new Error(errorData.error || "Failed to update team name in database");
      }

      console.log("Successfully updated team name in database");


      // Update team in local state
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId ? { ...team, name: newName.trim() } : team
        )
      );

      setTeamNameSuccess(teamId);
      setTimeout(() => setTeamNameSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating team name:", err);
      // Revert local state on error
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId ? { ...team, name: editingTeamNameValue } : team
        )
      );

      // Show error to user
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update team name";
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingTeamName(null);
      setEditingTeamName(null);
      setEditingTeamNameValue("");
    }
  };

  // Add Team function
  const handleAddTeam = async (data: {
    teamName: string;
    creators: string[];
    members?: { userId: string; role: string }[];
  }) => {
    try {
      // Call the new teams API to create a team using relational schema
      const response = await fetch("/api/pod/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.teamName.trim(),
          description: `Team created via admin dashboard`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add team");
      }

      const result = await response.json();
      if (!result.success || !result.team) {
        throw new Error("Failed to create team");
      }

      const createdTeam = result.team;

      // Assign creators to the team if any were selected
      if (data.creators && data.creators.length > 0) {
        try {
          const assignResponse = await fetch("/api/pod/assign-creators", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              teamId: createdTeam.id,
              creatorNames: data.creators,
            }),
          });

          if (!assignResponse.ok) {
            const assignError = await assignResponse.json();
            console.warn("Failed to assign creators:", assignError.error);
            // Don't throw error here, just log it as team was created successfully
          } else {
            const assignResult = await assignResponse.json();
            console.log(`Successfully assigned ${assignResult.assignments?.length || 0} creators to team`);
          }
        } catch (assignError) {
          console.warn("Error assigning creators to team:", assignError);
          // Don't throw error here, team was created successfully
        }
      }

      // If members were provided, add them to the team
      const initialMembers: TeamMember[] = [];
      if (data.members && data.members.length > 0) {
        // TODO: Add API endpoints for adding members to teams in relational schema
        // For now, create the member objects for display
        for (const memberData of data.members) {
          const user = users.find((u) => u.id === memberData.userId);
          if (user) {
            initialMembers.push({
              id: user.id,
              name: user.name || "Unknown User",
              email: user.email || "",
              role: memberData.role,
            });
          }
        }
      }

      // Create new team object for local state
      const newTeam: Team = {
        id: createdTeam.id, // Use actual team ID from database
        name: createdTeam.name,
        description: createdTeam.description,
        members: initialMembers,
        tasks: [],
        rowNumber: 0, // No longer using row numbers
        creators: data.creators,
      };

      // Add team to local state
      setTeams((prev) => [...prev, newTeam]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalTeams: prev.totalTeams + 1,
      }));

      // Refresh teams list to show updated data with creators
      const refreshedTeams = await fetchAvailableTeams();
      setStats((prev) => ({
        ...prev,
        totalTeams: refreshedTeams.length,
        totalCreators: [...new Set(refreshedTeams.flatMap(t => t.creators))].length,
      }));

      // Show success message
      setSuccessMessage(`Team "${data.teamName}" created successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error("Error adding team:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add team";
      setError(errorMessage);
      throw err; // Re-throw to handle in form
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
        console.log('📈 Stats calculation - Total members:', totalMembers, 'from teams:', fetchedTeams.length);

        setStats({
          totalUsers: 0, // Will be updated when users are fetched
          totalTeams: fetchedTeams.length,
          totalCreators: totalMembers,
          systemStatus: "healthy",
        });

        // Also fetch users to get POD count for overview
        await fetchUsers();

        // Fetch available creators for team management
        await fetchAvailableCreators();
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data");
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

  // Column management functions
  const fetchTeamColumns = async (teamId: string) => {
    setLoadingColumns(true);
    try {
      const response = await fetch(`/api/board-columns?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamColumns(data.columns || []);
      }
    } catch (error) {
      console.error('Failed to fetch team columns:', error);
    } finally {
      setLoadingColumns(false);
    }
  };

  const assignMemberToColumn = async (columnId: string, userId: string, teamId: string) => {
    setAssigningMember(true);
    try {
      const response = await fetch('/api/board-column-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, userId, teamId })
      });
      
      if (response.ok) {
        // Refresh columns data
        await fetchTeamColumns(teamId);
        setSuccessMessage('Member assigned to column successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign member');
      }
    } catch (error) {
      console.error('Failed to assign member:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to assign member'}`);
    } finally {
      setAssigningMember(false);
      setShowAssignMemberModal(null);
    }
  };

  const removeMemberFromColumn = async (assignmentId: string, teamId: string) => {
    try {
      const response = await fetch(`/api/board-column-assignments?assignmentId=${assignmentId}&teamId=${teamId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh columns data
        await fetchTeamColumns(teamId);
        setSuccessMessage('Member removed from column successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to remove member'}`);
    }
  };

  // Effect to fetch columns when team is selected
  useEffect(() => {
    if (showColumnAssignments) {
      fetchTeamColumns(showColumnAssignments);
    }
  }, [showColumnAssignments]);

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
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-right-full duration-300">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h2>
            </div>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium self-start sm:self-auto">
              Admin Only
            </span>
          </div>

          {/* View Toggle - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                activeView === "overview"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView("teams")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                activeView === "teams"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="hidden sm:inline">Team Management</span>
              <span className="sm:hidden">Teams</span>
            </button>
            <button
              onClick={() => {
                setActiveView("users");
                if (users.length === 0) fetchUsers();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                activeView === "users"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
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
          </>
        )}

        {/* Team Management View */}
        {activeView === "teams" && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Team Management
                </h3>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium self-start sm:self-auto">
                  {filteredTeams.length} teams
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full xl:w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              onChange={(e) =>
                                setEditingTeamNameValue(e.target.value)
                              }
                              className="text-lg font-semibold bg-transparent border-b-2 border-purple-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-600 flex-1"
                              placeholder="Team name"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  updateTeamName(team.id, editingTeamNameValue);
                                } else if (e.key === "Escape") {
                                  setEditingTeamName(null);
                                  setEditingTeamNameValue("");
                                }
                              }}
                            />
                            <button
                              onClick={() =>
                                updateTeamName(team.id, editingTeamNameValue)
                              }
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
                              <span className="text-green-600 dark:text-green-400 text-sm">
                                ✓ Updated
                              </span>
                            )}
                          </div>
                        )}

                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {team.description}
                          </p>
                        )}


                        {/* Creators Section */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          {editingCreators === team.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
                                  <Star className="w-3 h-3 text-white" />
                                </div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Assigned Creators:
                                </label>
                              </div>

                              {/* Creator Selection */}
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700">
                                  {availableCreators.length > 0 ? (
                                    availableCreators.map((creator) => {
                                      const isSelected =
                                        editingCreatorsValue.includes(creator);
                                      const canSelect =
                                        editingCreatorsValue.length < 3 ||
                                        isSelected;

                                      return (
                                        <button
                                          key={creator}
                                          type="button"
                                          onClick={() => {
                                            if (!canSelect) return;
                                            setEditingCreatorsValue((prev) =>
                                              isSelected
                                                ? prev.filter(
                                                    (c) => c !== creator
                                                  )
                                                : prev.length < 3
                                                  ? [...prev, creator]
                                                  : prev
                                            );
                                          }}
                                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                            isSelected
                                              ? "bg-purple-600 text-white"
                                              : canSelect
                                                ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                          }`}
                                          disabled={!canSelect}
                                          title={
                                            !canSelect
                                              ? "Maximum 3 creators allowed"
                                              : ""
                                          }
                                        >
                                          {creator}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
                                      {availableCreators.length === 0
                                        ? "No creators available from API"
                                        : "Loading creators..."}
                                    </div>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Select up to 3 creators (
                                  {editingCreatorsValue.length}/3 selected)
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    updateTeamCreators(
                                      team.id,
                                      editingCreatorsValue
                                    )
                                  }
                                  disabled={updatingCreators === team.id}
                                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                  {updatingCreators === team.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCreators(null);
                                    setEditingCreatorsValue([]);
                                  }}
                                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Creators:
                              </span>
                              {team.creators && team.creators.length > 0 ? (
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {team.creators.map((creator, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300"
                                    >
                                      {creator}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-xs text-gray-500 dark:text-gray-400">
                                  No creators assigned
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setEditingCreators(team.id);
                                  setEditingCreatorsValue(team.creators || []);
                                  if (availableCreators.length === 0) {
                                    fetchAvailableCreators();
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Edit creators"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              {creatorsSuccess === team.id && (
                                <span className="text-green-600 dark:text-green-400 text-xs animate-pulse">
                                  ✓ Updated
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative team-menu-container">
                        <button
                          onClick={() =>
                            setShowTeamMenu(
                              showTeamMenu === team.id ? null : team.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>

                        {showTeamMenu === team.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
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
                                setEditingCreators(team.id);
                                setEditingCreatorsValue(team.creators || []);
                                if (availableCreators.length === 0) {
                                  fetchAvailableCreators();
                                }
                                setShowTeamMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Star className="h-4 w-4" />
                              <span>Edit Creators</span>
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete team "${team.name}"?`
                                  )
                                ) {
                                  // TODO: Implement team deletion
                                  console.log("Delete team:", team.id);
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

                    <div className="grid grid-cols-3 gap-3 mb-4">
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

                      <button
                        onClick={() => setShowColumnAssignments(team.id)}
                        className="group bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 rounded-xl p-4 transition-all duration-300 text-left cursor-pointer border border-purple-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-400/50 hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-purple-700 dark:text-purple-300 block">
                              Notifications
                            </span>
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              Column alerts setup
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Creator Count Display */}
                    {team.creators && team.creators.length > 0 && (
                      <div className="mb-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                              {team.creators.length} Creator
                              {team.creators.length !== 1 ? "s" : ""} Assigned
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {team.creators.slice(0, 3).map((creator, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                              >
                                {creator}
                              </span>
                            ))}
                            {team.creators.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                +{team.creators.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                          <div key={member.id} className="relative group">
                            {member.image ? (
                              <img
                                src={`/api/image-proxy?url=${encodeURIComponent(member.image)}`}
                                alt={member.name || ""}
                                title={member.name || ""}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                              />
                            ) : (
                              <div 
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-gray-800 shadow-sm"
                                title={member.name || ""}
                              >
                                {(member.name || member.email || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-4 sm:my-8">
              {(() => {
                const team = teams.find((t) => t.id === showMembersModal);
                if (!team) return null;

                return (
                  <>
                    {/* Modal Header - Mobile Responsive */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {team.name} - Team Members
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.members.length} members in this team
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {/* Add Member Button */}
                          <button
                            onClick={async () => {
                              setShowAddMemberForm(team.id);
                              // Always refresh user list to ensure we have latest data
                              await fetchUsers();
                            }}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Member</span>
                            <span className="sm:hidden">Add</span>
                          </button>

                          <button
                            onClick={() => setShowMembersModal(null)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                          >
                            <X className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Modal Content - Mobile Responsive */}
                    <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
                      {team.members.length > 0 ? (
                        <div className="space-y-4">
                          {team.members.map((member, index) => (
                            <div
                              key={member.id}
                              className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              {/* Member Avatar and Info */}
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                {member.image ? (
                                  <img
                                    src={`/api/image-proxy?url=${encodeURIComponent(member.image)}`}
                                    alt={member.name || ""}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-white dark:border-gray-800 shadow-sm">
                                    {(member.name || member.email || "U").charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {member.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {member.email ? `${member.email} - ${member.role}` : member.role}
                                  </p>
                                </div>
                              </div>

                              {/* Role Badge or Role Editor */}
                              <div className="flex items-center justify-between sm:justify-end space-x-3">
                                {editingMember === `${team.id}-${member.id}` ? (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={member.role}
                                      onChange={(e) =>
                                        updateMemberRole(
                                          team.id,
                                          member.id,
                                          e.target.value
                                        )
                                      }
                                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm w-full sm:w-auto"
                                    >
                                      <option value="Member">Member</option>
                                      <option value="Lead">Lead</option>
                                      <option value="Manager">Manager</option>
                                    </select>
                                    <button
                                      onClick={() => setEditingMember(null)}
                                      className="p-1 text-green-600 hover:text-green-800 flex-shrink-0"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                      member.role === "Manager"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                        : member.role === "Lead"
                                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    }`}
                                  >
                                    {member.role}
                                  </div>
                                )}

                                {/* Member Actions */}
                                <div className="flex items-center space-x-1 sm:space-x-2">
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
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>

                                  {/* Edit Role Button */}
                                  <button
                                    onClick={() =>
                                      setEditingMember(
                                        editingMember ===
                                          `${team.id}-${member.id}`
                                          ? null
                                          : `${team.id}-${member.id}`
                                      )
                                    }
                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    title="Edit role"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>

                                  {/* Remove Member Button */}
                                  <button
                                    onClick={() => {
                                      setShowRemoveMemberConfirm({
                                        teamId: team.id,
                                        memberId: member.id,
                                        memberName: member.name,
                                        teamName: team.name,
                                      });
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                    title="Remove from team"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                </div>
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
                      <div className="flex items-center space-x-3">
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

        {/* Tasks Modal - Mobile Responsive */}
        {showTasksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] sm:max-h-[80vh] my-2 sm:my-8 overflow-hidden">
              {(() => {
                const team = teams.find((t) => t.id === showTasksModal);
                if (!team) return null;

                return (
                  <>
                    {/* Modal Header - Mobile Responsive */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                      {/* Title Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            <span className="sm:hidden">{team.name}</span>
                            <span className="hidden sm:inline">{team.name} - Team Tasks</span>
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.tasks.length} {team.tasks.length === 1 ? 'task' : 'tasks'}
                          </p>
                        </div>
                        
                        {/* Close button for mobile */}
                        <button
                          onClick={() => setShowTasksModal(null)}
                          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors self-start"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-0">
                        <div className="flex flex-row gap-2 sm:gap-3 flex-1">
                          {/* Refresh Tasks Button */}
                          <button
                            onClick={() => refreshTeamTasks(team.id)}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex-1 sm:flex-none"
                            title="Refresh tasks from database"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span className="hidden sm:inline">Refresh</span>
                          </button>

                          {/* Add Task Button */}
                          <button
                            onClick={() => {
                              if (showAddTaskForm === team.id) {
                                setShowAddTaskForm(null);
                              } else {
                                setShowAddTaskForm(team.id);
                                // Set current user as default assignee
                                setNewTaskData((prev) => ({
                                  ...prev,
                                  assignedTo: session?.user?.email || "",
                                }));
                              }
                              if (!podUsers.length) fetchUsers();
                            }}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm flex-1 sm:flex-none"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Task</span>
                          </button>
                        </div>

                        {/* Desktop Close Button */}
                        <button
                          onClick={() => setShowTasksModal(null)}
                          className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Add Task Form - Mobile Responsive */}
                    {showAddTaskForm === team.id && (
                      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Add New Task
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Task Title *
                            </label>
                            <input
                              type="text"
                              value={newTaskData.title}
                              onChange={(e) =>
                                setNewTaskData({
                                  ...newTaskData,
                                  title: e.target.value,
                                })
                              }
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
                              onChange={(e) =>
                                setNewTaskData({
                                  ...newTaskData,
                                  priority: e.target.value as
                                    | "low"
                                    | "medium"
                                    | "high",
                                })
                              }
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
                              onChange={(e) =>
                                setNewTaskData({
                                  ...newTaskData,
                                  assignedTo: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Unassigned</option>
                              {session?.user?.email && (
                                <option value={session.user.email}>
                                  {session.user.name || session.user.email}{" "}
                                  (You)
                                </option>
                              )}
                              {team.members.map((member) => (
                                <option
                                  key={member.id}
                                  value={member.email || member.id}
                                >
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id="set-due-date"
                                checked={hasDueDate}
                                onChange={(e) => {
                                  setHasDueDate(e.target.checked);
                                  if (!e.target.checked) {
                                    setNewTaskData({
                                      ...newTaskData,
                                      dueDate: "",
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                              />
                              <label
                                htmlFor="set-due-date"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                Set due date
                              </label>
                            </div>
                            {hasDueDate ? (
                              <input
                                type="date"
                                value={newTaskData.dueDate}
                                onChange={(e) =>
                                  setNewTaskData({
                                    ...newTaskData,
                                    dueDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            ) : (
                              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic">
                                No deadline set
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </label>
                            <textarea
                              value={newTaskData.description}
                              onChange={(e) =>
                                setNewTaskData({
                                  ...newTaskData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              rows={3}
                              placeholder="Enter task description..."
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-3 sm:space-x-0 mt-4">
                          <button
                            onClick={() => {
                              setShowAddTaskForm(null);
                              setHasDueDate(false);
                              setNewTaskData({
                                title: "",
                                description: "",
                                priority: "medium",
                                assignedTo: "",
                                dueDate: "",
                              });
                            }}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

                    {/* Modal Content - Mobile Responsive */}
                    <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
                      {team.tasks.length > 0 ? (
                        <div className="space-y-3">
                          {team.tasks.map((task, index) => (
                            <div
                              key={task.id}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                            >
                              <div className="space-y-4">
                                {/* Task Header - Mobile Layout */}
                                <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                                  {/* Task Status and Info */}
                                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                                    {/* Task Status Selector */}
                                    <div className="flex-shrink-0">
                                      <select
                                        value={task.status}
                                        onChange={(e) =>
                                          updateTaskStatus(
                                            team.id,
                                            task.id,
                                            e.target.value as
                                              | "not-started"
                                              | "in-progress"
                                              | "completed"
                                              | "on-hold"
                                          )
                                        }
                                        className={`w-24 sm:w-28 px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                                          task.status === "completed"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                            : task.status === "in-progress"
                                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                              : task.status === "on-hold"
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                        }`}
                                      >
                                        <option value="not-started">
                                          Not Started
                                        </option>
                                        <option value="in-progress">
                                          In Progress
                                        </option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                      </select>
                                    </div>

                                    {/* Task Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">
                                          {task.title}
                                        </h4>
                                        
                                        {/* Task Priority Badge */}
                                        <div
                                          className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                                            task.priority === "high"
                                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                              : task.priority === "medium"
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                          }`}
                                        >
                                          {task.priority}
                                        </div>
                                      </div>
                                      
                                      {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task Actions - Mobile */}
                                  <button
                                    onClick={() =>
                                      removeTaskFromTeam(team.id, task.id)
                                    }
                                    className="sm:hidden p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer self-start"
                                    title="Remove task"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Task Footer - Assignment and Due Date */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                                    {/* Assignee Section */}
                                    <div className="flex items-center gap-2">
                                      {editingTask === task.id ? (
                                        <div className="flex items-center space-x-2 flex-1">
                                          <select
                                            value={
                                              // Find the member by email first, fallback to ID for backwards compatibility
                                              team.members.find(
                                                (m) =>
                                                  m.email === task.assignedTo
                                              )?.id ||
                                              team.members.find(
                                                (m) => m.id === task.assignedTo
                                              )?.id ||
                                              ""
                                            }
                                            onChange={(e) =>
                                              updateTaskAssignment(
                                                team.id,
                                                task.id,
                                                e.target.value
                                              )
                                            }
                                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex-1 min-w-0"
                                          >
                                            <option value="">Unassigned</option>
                                            {team.members.map((member) => (
                                              <option
                                                key={member.id}
                                                value={member.id}
                                              >
                                                {member.name}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => setEditingTask(null)}
                                            className="p-1 text-green-600 hover:text-green-800 flex-shrink-0"
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2 flex-1">
                                          {task.assignedTo ? (
                                            <div className="flex items-center space-x-2 min-w-0">
                                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                {(
                                                  team.members.find(
                                                    (m) =>
                                                      m.email ===
                                                        task.assignedTo ||
                                                      m.id === task.assignedTo
                                                  )?.name ||
                                                  (session?.user?.email ===
                                                  task.assignedTo
                                                    ? session.user.name
                                                    : null) ||
                                                  task.assignedTo.split(
                                                    "@"
                                                  )[0] ||
                                                  "U"
                                                )
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")
                                                  .slice(0, 2)}
                                              </div>
                                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                {team.members.find(
                                                  (m) =>
                                                    m.email ===
                                                      task.assignedTo ||
                                                    m.id === task.assignedTo
                                                )?.name ||
                                                  (session?.user?.email ===
                                                  task.assignedTo
                                                    ? session.user.name
                                                    : null) ||
                                                  task.assignedTo.split(
                                                    "@"
                                                  )[0] ||
                                                  "Unknown"}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              Unassigned
                                            </span>
                                          )}
                                          <button
                                            onClick={() =>
                                              setEditingTask(task.id)
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex-shrink-0"
                                            title="Edit assignment"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Due Date */}
                                    <div className="flex items-center gap-2">
                                      {task.dueDate ? (
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                          <Calendar className="h-3 w-3 flex-shrink-0" />
                                          <span>
                                            {new Date(
                                              task.dueDate
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                                          <Calendar className="h-3 w-3 flex-shrink-0" />
                                          <span className="italic">
                                            No deadline
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task Actions - Desktop */}
                                  <button
                                    onClick={() =>
                                      removeTaskFromTeam(team.id, task.id)
                                    }
                                    className="hidden sm:block p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer flex-shrink-0"
                                    title="Remove task"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
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
                          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                            This team doesn't have any tasks yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer - Mobile Responsive */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => setShowTasksModal(null)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                          >
                            Close
                          </button>
                        </div>
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
                      onChange={(e) =>
                        setUserRoleFilter(
                          e.target.value as "all" | "POD" | "USER" | "GUEST"
                        )
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="POD">POD</option>
                      <option value="USER">USER</option>
                      <option value="GUEST">GUEST</option>
                    </select>
                  </div>
                  {(userSearchQuery || userRoleFilter !== "all") && (
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
                    Showing{" "}
                    {
                      users.filter((user) => {
                        const matchesSearch =
                          userSearchQuery === "" ||
                          user.name
                            ?.toLowerCase()
                            .includes(userSearchQuery.toLowerCase()) ||
                          user.email
                            ?.toLowerCase()
                            .includes(userSearchQuery.toLowerCase()) ||
                          user.role
                            .toLowerCase()
                            .includes(userSearchQuery.toLowerCase());
                        const matchesRole =
                          userRoleFilter === "all" ||
                          user.role === userRoleFilter;
                        return matchesSearch && matchesRole;
                      }).length
                    }{" "}
                    of {users.length} users
                    {(userSearchQuery || userRoleFilter !== "all") && (
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

            {!isUsersLoading &&
              (() => {
                const filteredUsers = users.filter((user) => {
                  // Filter by search query
                  const matchesSearch =
                    userSearchQuery === "" ||
                    user.name
                      ?.toLowerCase()
                      .includes(userSearchQuery.toLowerCase()) ||
                    user.email
                      ?.toLowerCase()
                      .includes(userSearchQuery.toLowerCase()) ||
                    user.role
                      .toLowerCase()
                      .includes(userSearchQuery.toLowerCase());

                  // Filter by role
                  const matchesRole =
                    userRoleFilter === "all" || user.role === userRoleFilter;

                  return matchesSearch && matchesRole;
                });

                if (
                  filteredUsers.length === 0 &&
                  (userSearchQuery || userRoleFilter !== "all")
                ) {
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
                        onRoleUpdate={async (
                          userId: string,
                          newRole: string
                        ) => {
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

      {/* Add Team Form Modal */}
      <AddTeamForm
        isOpen={showAddTeamForm}
        onClose={() => setShowAddTeamForm(false)}
        onSubmit={handleAddTeam}
        podUsers={users}
      />

      {/* Add Member Form Modal */}
      {showAddMemberForm && (
        <AddMemberForm
          isOpen={!!showAddMemberForm}
          onClose={() => setShowAddMemberForm(null)}
          onSubmit={(users) =>
            addMultipleMembersToTeam(showAddMemberForm, users)
          }
          podUsers={podUsers}
          existingMembers={
            teams.find((t) => t.id === showAddMemberForm)?.members || []
          }
          onRefreshUsers={fetchUsers}
        />
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberConfirm && (
        <RemoveMemberConfirmModal
          isOpen={!!showRemoveMemberConfirm}
          onClose={() => setShowRemoveMemberConfirm(null)}
          onConfirm={() => {
            if (showRemoveMemberConfirm) {
              removeMemberFromTeam(
                showRemoveMemberConfirm.teamId,
                showRemoveMemberConfirm.memberId
              );
            }
          }}
          memberName={showRemoveMemberConfirm.memberName}
          teamName={showRemoveMemberConfirm.teamName}
        />
      )}

      {/* Column Assignment Modal */}
      {showColumnAssignments && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Notification Settings
                    </h3>
                    <p className="text-purple-100 text-sm">
                      Set up who gets notified when tasks move between columns
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowColumnAssignments(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingColumns ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-32 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : teamColumns.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Target className="h-12 w-12 text-purple-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    No Board Columns
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    This team doesn't have any board columns set up yet. Create a board first to manage column notifications.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {teamColumns.map((column: any) => (
                    <div
                      key={column.id}
                      className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
                      style={{ 
                        boxShadow: `0 0 0 2px ${column.color}15`,
                        borderLeftColor: column.color,
                        borderLeftWidth: '6px'
                      }}
                    >
                      {/* Column Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: column.color }}
                          />
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {column.label}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-3 mt-1">
                              <span>Column {column.position + 1}</span>
                              <span>•</span>
                              <span className="capitalize">{column.status}</span>
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setShowAssignMemberModal({
                            columnId: column.id,
                            columnLabel: column.label,
                            teamId: showColumnAssignments
                          })}
                          className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <UserPlus className="h-5 w-5" />
                          <span>Add Person</span>
                        </button>
                      </div>
                      
                      {/* Notification Members */}
                      {column.assignedMembers && column.assignedMembers.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {column.assignedMembers.length} {column.assignedMembers.length === 1 ? 'Person' : 'People'} Getting Notified
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                They'll be alerted when tasks move to this column
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-3">
                            {column.assignedMembers.map((assignment: any) => (
                              <div
                                key={assignment.id}
                                className="group flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center space-x-4">
                                  {assignment.user.image ? (
                                    <img
                                      src={`/api/image-proxy?url=${encodeURIComponent(assignment.user.image)}`}
                                      alt={assignment.user.name}
                                      className="w-12 h-12 rounded-full object-cover border-3 border-gray-200 dark:border-gray-500"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                      {assignment.user.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                      {assignment.user.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {assignment.user.email}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center space-x-1 mt-1">
                                      <span>Added by</span>
                                      <span className="font-medium">{assignment.assignedBy.name}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => removeMemberFromColumn(assignment.id, showColumnAssignments!)}
                                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  title="Remove from notifications"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-gray-400" />
                          </div>
                          <h5 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            No Notifications Set
                          </h5>
                          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                            Add team members to get notified when tasks move to this column
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Assignment Modal */}
      {showAssignMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Add to {showAssignMemberModal.columnLabel}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Choose who gets notified
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignMemberModal(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Member List */}
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  const selectedTeam = teams.find(t => t.id === showColumnAssignments);
                  if (!selectedTeam) return (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">No team selected</p>
                    </div>
                  );
                  
                  const assignedUserIds = teamColumns
                    .find((c: any) => c.id === showAssignMemberModal.columnId)
                    ?.assignedMembers?.map((a: any) => a.userId) || [];
                    
                  const availableMembers = selectedTeam.members.filter(
                    member => !assignedUserIds.includes(member.id)
                  );
                  
                  if (availableMembers.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <UserPlus className="h-10 w-10 text-green-500" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Everyone's Already Added!
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                          All team members are already getting notifications for this column.
                        </p>
                      </div>
                    );
                  }
                  
                  return availableMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        assignMemberToColumn(
                          showAssignMemberModal.columnId,
                          member.userId || member.id, // Use userId when available, fallback to id
                          showAssignMemberModal.teamId
                        )
                      }
                      disabled={assigningMember}
                      className="group w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-2xl border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {member.image ? (
                        <img
                          src={`/api/image-proxy?url=${encodeURIComponent(member.image)}`}
                          alt={member.name}
                          className="w-14 h-14 rounded-full object-cover border-3 border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full inline-block">
                          {member.role}
                        </div>
                      </div>
                      {assigningMember ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Adding...</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 dark:group-hover:from-blue-800/50 dark:group-hover:to-purple-800/50 transition-all">
                          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
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

// Add Team Form Component
const AddTeamForm = ({
  isOpen,
  onClose,
  onSubmit,
  podUsers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    teamName: string;
    creators: string[];
    members?: { userId: string; role: string }[];
  }) => void;
  podUsers: SystemUser[];
}) => {
  const [formData, setFormData] = useState({
    teamName: "",
  });
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [availableCreators, setAvailableCreators] = useState<{id: string; name: string}[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatorsSearchTerm, setCreatorsSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<
    { userId: string; role: string }[]
  >([]);
  const [membersSearchTerm, setMembersSearchTerm] = useState("");

  const MAX_CREATORS = 3;
  const MAX_MEMBERS = 5; // Optional team members limit

  // Filter creators based on search term
  const filteredCreators = availableCreators.filter((creator) =>
    creator.name.toLowerCase().includes(creatorsSearchTerm.toLowerCase())
  );

  // Filter POD users for members based on search term and exclude already selected
  const filteredPodUsers = podUsers
    .filter((user) => user.role === "POD")
    .filter(
      (user) => !selectedMembers.some((member) => member.userId === user.id)
    )
    .filter(
      (user) =>
        user.name?.toLowerCase().includes(membersSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(membersSearchTerm.toLowerCase())
    );

  // Handle creator selection
  const handleCreatorToggle = (creatorName: string) => {
    setSelectedCreators((prev) => {
      if (prev.includes(creatorName)) {
        return prev.filter((c) => c !== creatorName);
      } else if (prev.length < MAX_CREATORS) {
        return [...prev, creatorName];
      }
      return prev;
    });
  };

  // Handle member selection
  const handleMemberAdd = (userId: string, role: string) => {
    if (selectedMembers.length < MAX_MEMBERS) {
      setSelectedMembers((prev) => [...prev, { userId, role }]);
    }
  };

  // Handle member removal
  const handleMemberRemove = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.userId !== userId)
    );
  };

  // Fetch all available creators from API (using database endpoint)
  const fetchAvailableCreators = async () => {
    setIsLoadingCreators(true);
    try {
      const response = await fetch("/api/creators-db");
      const data = await response.json();
      
      console.log('Full API response:', data);
      console.log('data.creators type:', typeof data.creators);
      console.log('Is creators array:', Array.isArray(data.creators));

      if (Array.isArray(data.creators)) {
        console.log('Raw creators data from API (modal):', data.creators);
        
        // Extract creator names and IDs from database
        const creatorsData = data.creators
          .map((creator: any) => ({
            id: creator.id,
            name: creator.name?.trim() || creator.clientName?.trim()
          }))
          .filter(
            (creator: any, index: number, array: any[]) =>
              creator.name && creator.name.length > 0 && 
              array.findIndex(c => c.name === creator.name) === index
          )
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
          
        console.log('Processed creators data (modal):', creatorsData);
        setAvailableCreators(creatorsData);
      } else {
        console.error(
          "Failed to fetch creators from database:",
          data.error || "No creators array in response"
        );
        console.error("Actual response data:", data);
        setAvailableCreators([]);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setAvailableCreators([]);
    } finally {
      setIsLoadingCreators(false);
    }
  };

  // Fetch creators when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCreators();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        creators: selectedCreators,
        members: selectedMembers.length > 0 ? selectedMembers : undefined,
      });
      setFormData({
        teamName: "",
      });
      setSelectedCreators([]);
      setSelectedMembers([]);
      setCreatorsSearchTerm("");
      setMembersSearchTerm("");
      onClose();
    } catch (error) {
      console.error("Error adding team:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidUrl = (url: string) => {
    return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(
      url
    );
  };

  const isFormValid = formData.teamName.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-5xl mx-4 max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Add New Team
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Team Information Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold mr-3">
                1
              </span>
              Basic Information
            </h4>

            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Team Name
              </label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, teamName: e.target.value }))
                }
                placeholder="Enter team name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

          </div>

          {/* Creators Assignment Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold mr-3">
                2
              </span>
              Assign Creators (Optional)
            </h4>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign Creators (Optional - Max {MAX_CREATORS})
                </label>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCreators.length}/{MAX_CREATORS} selected
                  </div>
                  {!isLoadingCreators && (
                    <button
                      type="button"
                      onClick={fetchAvailableCreators}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Refresh creators list"
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Limit Warning */}
              {selectedCreators.length >= MAX_CREATORS && (
                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Maximum of {MAX_CREATORS} creators can be assigned to a
                    team.
                  </p>
                </div>
              )}

              {/* Creators Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={creatorsSearchTerm}
                  onChange={(e) => setCreatorsSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Creators Grid */}
              {isLoadingCreators ? (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Loading creators...
                    </span>
                  </div>
                </div>
              ) : filteredCreators.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                  {filteredCreators.map((creator) => {
                    const isSelected = selectedCreators.includes(creator.name);
                    const canSelect =
                      selectedCreators.length < MAX_CREATORS || isSelected;

                    return (
                      <label
                        key={creator.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          !canSelect ? "opacity-50 cursor-not-allowed" : ""
                        } ${
                          isSelected
                            ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-500 shadow-md"
                            : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-purple-200 dark:hover:border-purple-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            canSelect && handleCreatorToggle(creator.name)
                          }
                          disabled={!canSelect}
                          className="h-5 w-5 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                          {creator.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {availableCreators.length === 0
                      ? "No creators found. Please check the models API endpoint."
                      : `No creators match "${creatorsSearchTerm}"`}
                  </p>
                  {availableCreators.length === 0 && (
                    <button
                      type="button"
                      onClick={fetchAvailableCreators}
                      className="mt-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Selected Creators Preview */}
              {selectedCreators.length > 0 && (
                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selected Creators ({selectedCreators.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCreators.map((creator) => (
                      <span
                        key={creator}
                        className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full"
                      >
                        {creator}
                        <button
                          type="button"
                          onClick={() => handleCreatorToggle(creator)}
                          className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Team Members Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold mr-3">
                3
              </span>
              Add Team Members (Optional)
            </h4>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select POD Users (Max {MAX_MEMBERS})
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedMembers.length}/{MAX_MEMBERS} selected
                </div>
              </div>

              {/* Members Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search POD users by name or email..."
                  value={membersSearchTerm}
                  onChange={(e) => setMembersSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Available POD Users */}
              {filteredPodUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  {filteredPodUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          onChange={(e) => {
                            if (
                              e.target.value &&
                              selectedMembers.length < MAX_MEMBERS
                            ) {
                              handleMemberAdd(user.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          disabled={selectedMembers.length >= MAX_MEMBERS}
                        >
                          <option value="">Add as...</option>
                          <option value="LEADER">Leader</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {podUsers.filter((u) => u.role === "POD").length === 0
                      ? "No POD users available"
                      : selectedMembers.length >= MAX_MEMBERS
                        ? "Maximum number of members selected"
                        : `No POD users match "${membersSearchTerm}"`}
                  </p>
                </div>
              )}

              {/* Selected Members Preview */}
              {selectedMembers.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Selected Members ({selectedMembers.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => {
                      const user = podUsers.find((u) => u.id === member.userId);
                      return (
                        <span
                          key={member.userId}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                        >
                          {user?.email ? `${user.email} - ${member.role}` : `${user?.name || "Unknown"} - ${member.role}`}
                          <button
                            type="button"
                            onClick={() => handleMemberRemove(member.userId)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Team</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Member Form Component
const AddMemberForm = ({
  isOpen,
  onClose,
  onSubmit,
  podUsers,
  existingMembers,
  onRefreshUsers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (users: { userId: string; role: string; userEmail?: string; userName?: string }[]) => void;
  podUsers: SystemUser[];
  existingMembers: TeamMember[];
  onRefreshUsers: () => void;
}) => {
  const [selectedUsers, setSelectedUsers] = useState<SystemUser[]>([]);
  const [userRoles, setUserRoles] = useState<
    Record<string, "Member" | "Lead" | "Manager">
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const MAX_SELECTIONS = 3;

  // Filter available users (POD users not already in team)
  const availableUsers = podUsers.filter(
    (user) =>
      user.email && // Only show users with valid email addresses
      !existingMembers.some((member) => member.email === user.email) &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  console.log(`🔍 AddMemberForm - Existing members emails:`, existingMembers.map(m => m.email));
  console.log(`🔍 AddMemberForm - Available users (${availableUsers.length}):`, availableUsers.map(u => u.email));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshUsers();
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUserToggle = (user: SystemUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        // Remove user and their role
        setUserRoles((prevRoles) => {
          const newRoles = { ...prevRoles };
          delete newRoles[user.id];
          return newRoles;
        });
        return prev.filter((u) => u.id !== user.id);
      } else {
        // Add user if under limit
        if (prev.length < MAX_SELECTIONS) {
          // Set default role for new user
          setUserRoles((prevRoles) => ({
            ...prevRoles,
            [user.id]: "Member",
          }));
          return [...prev, user];
        }
        return prev;
      }
    });
  };

  const handleRoleChange = (
    userId: string,
    role: "Member" | "Lead" | "Manager"
  ) => {
    setUserRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  const isUserSelected = (user: SystemUser) => {
    return selectedUsers.some((u) => u.id === user.id);
  };

  const canSelectMore = selectedUsers.length < MAX_SELECTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    setIsSubmitting(true);
    try {
      // Create array of users with their individual roles and email/name for reliable lookup
      const usersToAdd = selectedUsers.map((user) => ({
        userId: user.id,
        role: userRoles[user.id] || "Member",
        userEmail: user.email || undefined,
        userName: user.name || undefined,
      }));

      console.log('🔍 AddMemberForm - About to submit users:', usersToAdd);
      console.log('🔍 AddMemberForm - Selected users from state:', selectedUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));

      // Submit all users at once
      await onSubmit(usersToAdd);

      // Reset form
      setSelectedUsers([]);
      setUserRoles({});
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error adding members:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Manager":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/30";
      case "Lead":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30";
      case "Member":
      default:
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-500/30";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Team Member
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          {/* User Search */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search POD Users
              </label>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh POD users list"
              >
                <svg
                  className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User Selection */}
          <div className="mb-4 flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Users (Max {MAX_SELECTIONS})
              </label>
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {selectedUsers.length}/{MAX_SELECTIONS} selected
                </span>
                <span>•</span>
                <span>{availableUsers.length} available</span>
              </div>
            </div>

            {/* Selection Limit Warning */}
            {selectedUsers.length >= MAX_SELECTIONS && (
              <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Maximum of {MAX_SELECTIONS} members can be selected at once.
                </p>
              </div>
            )}

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => {
                  const selected = isUserSelected(user);
                  const canSelect = canSelectMore || selected;

                  return (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 cursor-pointer ${
                        !canSelect ? "opacity-50 cursor-not-allowed" : ""
                      } ${selected ? "bg-purple-50 dark:bg-purple-900/30" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => canSelect && handleUserToggle(user)}
                        disabled={!canSelect}
                        className="mr-3 h-4 w-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />

                      <div className="flex items-center space-x-3 flex-1">
                        {user.image ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                            alt={user.name || ""}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            {(user.name || user.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                        {selected && (
                          <div className="text-purple-600 dark:text-purple-400">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? "No users match your search"
                    : "No POD users available"}
                </div>
              )}
            </div>
          </div>

          {/* Selected Users Preview with Individual Role Selection */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Selected Members ({selectedUsers.length}) - Assign Individual
                Roles:
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedUsers.map((user) => {
                  const userRole = userRoles[user.id] || "Member";
                  return (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500"
                    >
                      {user.image ? (
                        <img
                          src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                          alt={user.name || ""}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {(user.name || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email ? `${user.email} - ${userRole}` : userRole}
                        </div>
                      </div>

                      {/* Individual Role Selector */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={userRole}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as "Member" | "Lead" | "Manager"
                            )
                          }
                          className="text-xs border border-gray-300 dark:border-gray-500 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="Member">Member</option>
                          <option value="Lead">Lead</option>
                          <option value="Manager">Manager</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleUserToggle(user)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title={`Remove ${user.name || user.email}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>

            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUsers([]);
                  setUserRoles({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}

            <button
              type="submit"
              disabled={selectedUsers.length === 0 || isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>
                  Add{" "}
                  {selectedUsers.length === 1
                    ? "Member"
                    : `${selectedUsers.length} Members`}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Remove Member Confirmation Modal Component
const RemoveMemberConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  teamName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  teamName: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Remove Team Member
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {memberName}
            </span>{" "}
            from{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {teamName}
            </span>
            ?
          </p>
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-medium">
                  This will remove the member from the team
                </p>
                <p>
                  The member will no longer have access to this team's resources.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <UserMinus className="h-4 w-4" />
            <span>Remove Member</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodAdminDashboard;
