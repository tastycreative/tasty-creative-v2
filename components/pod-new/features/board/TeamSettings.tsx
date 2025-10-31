"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Settings,
  Edit,
  UserPlus,
  Save,
  X,
  Search,
  Edit2,
  UserMinus,
  Check,
  AlertTriangle,
  Target,
  User,
  Loader2,
  Star,
  Bell,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  Circle,
  Shield,
  UserCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  image?: string;
  userId?: string;
}

interface TeamSettingsProps {
  teamId: string;
  teamName: string;
  teamMembers: TeamMember[];
  onTeamUpdate?: () => void;
}

interface TeamData {
  id: string;
  name: string;
  projectPrefix?: string;
  columnNotificationsEnabled?: boolean;
  creators: { id: string; name: string }[];
  teamMembers: TeamMember[];
}

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
}

interface BoardColumn {
  id: string;
  label: string;
  position: number;
  assignments: ColumnAssignment[];
}

interface ColumnAssignment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedBy: {
    id: string;
    name: string;
  };
}

const TeamSettings: React.FC<TeamSettingsProps> = ({
  teamId,
  teamName,
  teamMembers: initialMembers,
  onTeamUpdate,
}) => {
  const { data: session } = useSession();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loadingTeamData, setLoadingTeamData] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialMembers || []);
  const [availableUsers, setAvailableUsers] = useState<SystemUser[]>([]);
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);

  // Creator assignment state
  const [teamCreators, setTeamCreators] = useState<{id: string, name: string, image?: string}[]>([]);
  const [availableCreators, setAvailableCreators] = useState<{id: string, name: string, image?: string}[]>([]);

  // Helper function to process image URLs (similar to EnhancedModelCard)
  const processImageUrl = (url?: string): string | null => {
    if (!url) return null;

    // Google Drive handling
    if (url.includes("drive.google.com")) {
      try {
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        let driveId: string | null = null;
        if (fileMatch && fileMatch[1]) {
          driveId = fileMatch[1];
        } else {
          const urlObj = new URL(url);
          driveId = urlObj.searchParams.get("id");
        }
        if (driveId) {
          return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
        }
      } catch (e) {
        // fall through
      }
    }
    return url;
  };
  const [updatingCreators, setUpdatingCreators] = useState(false);
  const [creatorsSuccess, setCreatorsSuccess] = useState(false);
  
  // Creator management UI state
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const creatorsPerPage = 20;

  // Column notification state
  const [teamColumns, setTeamColumns] = useState<BoardColumn[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [showColumnNotifications, setShowColumnNotifications] = useState(false);
  const [showAssignNotificationModal, setShowAssignNotificationModal] = useState<{
    columnId: string;
    columnLabel: string;
  } | null>(null);
  const [assigningNotification, setAssigningNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Multi-select notification assignment state
  const [selectedNotificationUsers, setSelectedNotificationUsers] = useState<string[]>([]);
  const [notificationSearchQuery, setNotificationSearchQuery] = useState("");
  
  // Editing states
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [editingTeamNameValue, setEditingTeamNameValue] = useState(teamName);
  const [editingTeamPrefix, setEditingTeamPrefix] = useState(false);
  const [editingTeamPrefixValue, setEditingTeamPrefixValue] = useState("");
  
  // Column notifications toggle state
  const [columnNotificationsEnabled, setColumnNotificationsEnabled] = useState(true);
  const [updatingNotificationsToggle, setUpdatingNotificationsToggle] = useState(false);
  
  // Loading states
  const [updatingTeamName, setUpdatingTeamName] = useState(false);
  const [updatingTeamPrefix, setUpdatingTeamPrefix] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  
  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);
  
  // Add member form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("MEMBER");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Fetch available users for adding to team
  const fetchAvailableUsers = async () => {
    if (!isAdmin) return;
    
    setLoadingAvailableUsers(true);
    try {
      const response = await fetch("/api/admin/users?limit=all");
      if (response.ok) {
        const data = await response.json();
        // Extract users array from the response object
        const users = data.success && Array.isArray(data.users) ? data.users : [];
        setAvailableUsers(users);
      } else {
        console.error("Failed to fetch users:", response.status);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]); // Set empty array on error
    } finally {
      setLoadingAvailableUsers(false);
    }
  };

  useEffect(() => {
    if (showAddMemberModal) {
      fetchAvailableUsers();
    }
  }, [showAddMemberModal]);

  // Fetch team data including creators and project prefix
  const fetchTeamData = async () => {
    setLoadingTeamData(true);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}/details`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          setTeamData({
            id: data.id,
            name: data.name,
            projectPrefix: data.projectPrefix,
            columnNotificationsEnabled: data.columnNotificationsEnabled,
            creators: data.creators || [],
            teamMembers: data.teamMembers || []
          });
          setTeamCreators(data.creators || []);
          setEditingTeamNameValue(data.name);
          setEditingTeamPrefixValue(data.projectPrefix || "");
          setColumnNotificationsEnabled(data.columnNotificationsEnabled ?? true);
          setTeamMembers(data.teamMembers || initialMembers);
        }
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
    } finally {
      setLoadingTeamData(false);
    }
  };

  const fetchAvailableCreators = async () => {
    if (!isAdmin) return;
    
    setLoadingCreators(true);
    try {
      const response = await fetch("/api/pod/available-creators");
      if (response.ok) {
        const creators = await response.json();
        setAvailableCreators(creators);
      }
    } catch (error) {
      console.error("Error fetching available creators:", error);
    } finally {
      setLoadingCreators(false);
    }
  };

  // Fetch team columns for notification settings
  const fetchTeamColumns = async () => {
    setLoadingColumns(true);
    try {
      const response = await fetch(`/api/board-column-assignments?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        // The board-column-assignments endpoint returns the columns directly as an array
        setTeamColumns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching team columns:", error);
      setTeamColumns([]); // Set empty array on error
    } finally {
      setLoadingColumns(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
    if (isAdmin) {
      fetchAvailableCreators();
    }
  }, [teamId, isAdmin]);

  useEffect(() => {
    if (showColumnNotifications) {
      fetchTeamColumns();
    }
  }, [showColumnNotifications]);

  // Team name update function
  const updateTeamName = async (newName: string) => {
    if (!newName.trim() || !isAdmin) return;
    
    setUpdatingTeamName(true);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        const updatedName = newName.trim();
        setEditingTeamName(false);
        setEditingTeamNameValue(updatedName);
        // Update local teamData state immediately
        setTeamData(prev => prev ? { ...prev, name: updatedName } : null);
        onTeamUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to update team name: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating team name:", error);
      alert("Failed to update team name");
    } finally {
      setUpdatingTeamName(false);
    }
  };

  // Team prefix update function
  const updateTeamPrefix = async (newPrefix: string) => {
    if (!newPrefix.trim() || !isAdmin) return;
    
    const prefix = newPrefix.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,5}$/.test(prefix)) {
      alert("Project prefix must be 3-5 characters (letters and numbers only)");
      return;
    }

    setUpdatingTeamPrefix(true);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPrefix: prefix }),
      });

      if (response.ok) {
        setEditingTeamPrefix(false);
        setEditingTeamPrefixValue(prefix);
        // Update local teamData state immediately
        setTeamData(prev => prev ? { ...prev, projectPrefix: prefix } : null);
        onTeamUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to update team prefix: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating team prefix:", error);
      alert("Failed to update team prefix");
    } finally {
      setUpdatingTeamPrefix(false);
    }
  };

  // Column notifications toggle update function
  const updateColumnNotificationsToggle = async (enabled: boolean) => {
    if (!isAdmin) return;

    setUpdatingNotificationsToggle(true);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnNotificationsEnabled: enabled }),
      });

      if (response.ok) {
        setColumnNotificationsEnabled(enabled);
        // Update local teamData state immediately
        setTeamData(prev => prev ? { ...prev, columnNotificationsEnabled: enabled } : null);
        onTeamUpdate?.();
        setSuccessMessage(enabled ? 'Column notifications enabled' : 'Column notifications disabled');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        alert(`Failed to update notification settings: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      alert("Failed to update notification settings");
    } finally {
      setUpdatingNotificationsToggle(false);
    }
  };

  // Add member to team
  const addMemberToTeam = async () => {
    if (!selectedUserId || !isAdmin) return;

    setAddingMember(true);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedUserRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.members) {
          setTeamMembers(data.members);
        }
        setShowAddMemberModal(false);
        setSelectedUserId("");
        setSelectedUserRole("MEMBER");
        setUserSearchQuery("");
        onTeamUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to add member: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member to team");
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member from team
  const removeMemberFromTeam = async (memberId: string) => {
    if (!isAdmin) return;

    setRemovingMember(memberId);
    try {
      const response = await fetch(`/api/pod/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (response.ok) {
        setTeamMembers(prev => prev.filter(m => m.id !== memberId));
        setShowRemoveMemberConfirm(null);
        onTeamUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to remove member: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member from team");
    } finally {
      setRemovingMember(null);
    }
  };

  // Update team creators
  const updateTeamCreators = async (newCreators: string[]) => {
    setUpdatingCreators(true);
    try {
      const response = await fetch("/api/pod/update-team-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, creators: newCreators }),
      });

      if (response.ok) {
        // Refresh team data to get updated creator objects with images
        await fetchTeamData();
        setShowCreatorModal(false);
        setCreatorsSuccess(true);
        setTimeout(() => setCreatorsSuccess(false), 3000);
        onTeamUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to update creators: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating team creators:", error);
      alert("Failed to update team creators");
    } finally {
      setUpdatingCreators(false);
    }
  };

  // Open creator management modal
  const openCreatorModal = () => {
    setSelectedCreators(teamCreators.map(c => c.name));
    setCreatorSearchQuery("");
    setCurrentPage(1);
    setShowCreatorModal(true);
    if (availableCreators.length === 0) {
      fetchAvailableCreators();
    }
  };

  // Toggle creator selection
  const toggleCreatorSelection = (creatorName: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorName)
        ? prev.filter(name => name !== creatorName)
        : [...prev, creatorName]
    );
  };

  // Select/deselect all filtered creators
  const toggleAllCreators = (filteredCreators: {id: string, name: string, image?: string}[]) => {
    const creatorNames = filteredCreators.map(c => c.name);
    const allSelected = creatorNames.every(creator => selectedCreators.includes(creator));
    if (allSelected) {
      setSelectedCreators(prev => prev.filter(name => !creatorNames.includes(name)));
    } else {
      setSelectedCreators(prev => [...new Set([...prev, ...creatorNames])]);
    }
  };

  // Filter and paginate creators
  const filteredCreators = availableCreators.filter(creator =>
    creator.name.toLowerCase().includes(creatorSearchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredCreators.length / creatorsPerPage);
  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * creatorsPerPage,
    currentPage * creatorsPerPage
  );

  const selectedCount = selectedCreators.length;
  const totalCount = availableCreators.length;
  const filteredCount = filteredCreators.length;

  // Assign multiple members to column notification
  const assignMembersToColumn = async (columnId: string, userIds: string[]) => {
    setAssigningNotification(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process assignments in parallel
      const promises = userIds.map(async (userId) => {
        try {
          const response = await fetch('/api/board-column-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columnId, userId, teamId })
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to assign user ${userId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error assigning user ${userId}:`, error);
        }
      });

      await Promise.all(promises);
      
      // Refresh data and provide feedback
      await fetchTeamColumns();
      setShowAssignNotificationModal(null);
      setSelectedNotificationUsers([]);
      setNotificationSearchQuery("");
      
      if (successCount > 0 && errorCount === 0) {
        setSuccessMessage(`Successfully added ${successCount} member${successCount !== 1 ? 's' : ''} to column notifications`);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccessMessage(`Added ${successCount} member${successCount !== 1 ? 's' : ''}, failed to add ${errorCount}`);
      } else {
        alert('Failed to add any members to column notifications');
      }
      
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Failed to assign members:', error);
      alert('Failed to assign members to column notifications');
    } finally {
      setAssigningNotification(false);
    }
  };

  // Helper functions for notification modal
  const toggleNotificationUserSelection = (userId: string) => {
    setSelectedNotificationUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllNotificationUsers = (availableUsers: TeamMember[]) => {
    const availableUserIds = availableUsers.map(user => user.userId).filter(Boolean) as string[];
    const allSelected = availableUserIds.every(userId => selectedNotificationUsers.includes(userId));
    
    if (allSelected) {
      setSelectedNotificationUsers(prev => prev.filter(id => !availableUserIds.includes(id)));
    } else {
      setSelectedNotificationUsers(prev => [...new Set([...prev, ...availableUserIds])]);
    }
  };

  const openNotificationModal = (columnId: string, columnLabel: string) => {
    setSelectedNotificationUsers([]);
    setNotificationSearchQuery("");
    setShowAssignNotificationModal({ columnId, columnLabel });
  };

  // Remove member from column notification
  const removeMemberFromColumn = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/board-column-assignments?assignmentId=${assignmentId}&teamId=${teamId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchTeamColumns();
        setSuccessMessage('Member removed from column notifications successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert('Failed to remove member from column notifications');
      }
    } catch (error) {
      console.error('Error removing member from column:', error);
      alert('Failed to remove member from column notifications');
    }
  };

  // Filter available users (exclude current team members)
  const filteredAvailableUsers = (Array.isArray(availableUsers) ? availableUsers : []).filter(user => {
    if (!user || typeof user !== 'object') return false;
    
    const isNotMember = !teamMembers.some(member => member.userId === user.id);
    const matchesSearch = userSearchQuery === "" || 
      user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    return isNotMember && matchesSearch;
  });

  // Get available members for column notifications (excluding already assigned)
  const getAvailableMembersForColumn = (columnId: string) => {
    const column = teamColumns.find(c => c.id === columnId);
    if (!column) return teamMembers;
    
    const assignedUserIds = column.assignments.map(a => a.user.id);
    return teamMembers.filter(member => 
      member.userId && !assignedUserIds.includes(member.userId)
    );
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div className="p-6 space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loadingTeamData) {
    return (
      <div className="min-h-screen">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="max-w-5xl mx-auto px-6 py-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72"></div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="lg:col-span-1">
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your team configuration, members, and notifications
          </p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className=" mx-auto pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Primary Settings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">General</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Basic team information</p>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {/* Team Name */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Team Name</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The display name for your team</p>
                    </div>
                    {editingTeamName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTeamNameValue}
                          onChange={(e) => setEditingTeamNameValue(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTeamName(editingTeamNameValue);
                            if (e.key === 'Escape') {
                              setEditingTeamName(false);
                              setEditingTeamNameValue(teamName);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => updateTeamName(editingTeamNameValue)}
                          disabled={updatingTeamName}
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {updatingTeamName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTeamName(false);
                            setEditingTeamNameValue(teamName);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{teamData?.name || editingTeamNameValue}</span>
                        {isAdmin && (
                          <button
                            onClick={() => setEditingTeamName(true)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Prefix */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Project Prefix</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3-5 character code for project IDs</p>
                    </div>
                    {editingTeamPrefix ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTeamPrefixValue}
                          onChange={(e) => setEditingTeamPrefixValue(e.target.value.toUpperCase())}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-28 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={5}
                          placeholder="ABC"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTeamPrefix(editingTeamPrefixValue);
                            if (e.key === 'Escape') {
                              setEditingTeamPrefix(false);
                              setEditingTeamPrefixValue(teamData?.projectPrefix || "");
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => updateTeamPrefix(editingTeamPrefixValue)}
                          disabled={updatingTeamPrefix || editingTeamPrefixValue.length < 3}
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {updatingTeamPrefix ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTeamPrefix(false);
                            setEditingTeamPrefixValue(teamData?.projectPrefix || "");
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-gray-900 dark:text-gray-100 font-medium">
                          {teamData?.projectPrefix || editingTeamPrefixValue || "Not set"}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => setEditingTeamPrefix(true)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column Notifications Toggle */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Column Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enable or disable notifications when tasks move between columns</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${columnNotificationsEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {columnNotificationsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => updateColumnNotificationsToggle(!columnNotificationsEnabled)}
                          disabled={updatingNotificationsToggle}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                            columnNotificationsEnabled 
                              ? 'bg-green-600' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          {updatingNotificationsToggle ? (
                            <Loader2 className="h-3 w-3 text-white animate-spin mx-auto" />
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                columnNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in this team</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {teamMembers.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.role === 'ADMIN' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : member.role === 'MODERATOR'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {member.role}
                      </span>
                      {isAdmin && member.userId !== session?.user?.id && (
                        <button
                          onClick={() => setShowRemoveMemberConfirm({ memberId: member.id, memberName: member.name })}
                          disabled={removingMember === member.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        >
                          {removingMember === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Notifications Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Column Notifications</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage who gets notified for each board column</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowColumnNotifications(!showColumnNotifications)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {showColumnNotifications ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Manage
                      </>
                    )}
                  </button>
                )}
              </div>

              {showColumnNotifications && (
                <div className="p-6">
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                      {successMessage}
                    </div>
                  )}
                  
                  {loadingColumns ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : teamColumns.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No board columns found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamColumns.map((column) => (
                        <div key={column.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{column.label}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {column.assignments.length} member{column.assignments.length !== 1 ? 's' : ''} notified
                              </p>
                            </div>
                            
                            {getAvailableMembersForColumn(column.id).length > 0 && (
                              <button
                                onClick={() => openNotificationModal(column.id, column.label)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add
                              </button>
                            )}
                          </div>
                          
                          {column.assignments.length > 0 && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                              {column.assignments.map((assignment) => (
                                <div key={assignment.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 group">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                      {(assignment.user as any).image ? (
                                        <img
                                          src={(assignment.user as any).image}
                                          alt={assignment.user.name || 'User'}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white text-xs font-medium">
                                          {(assignment.user.name || assignment.user.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {assignment.user.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        Added by {assignment.assignedBy.name}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => removeMemberFromColumn(assignment.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Secondary Info */}
          <div className="lg:col-span-1">
            {/* Creators Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm sticky top-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Assigned Creators</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teamCreators.length} creator{teamCreators.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="p-5">
                {teamCreators && teamCreators.length > 0 ? (
                  <div className="space-y-2">
                    {teamCreators.map((creator, index) => (
                      <div
                        key={creator.id || index}
                        className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {processImageUrl(creator.image) ? (
                            <img
                              src={processImageUrl(creator.image)!}
                              alt={creator.name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-medium ${processImageUrl(creator.image) ? 'hidden' : ''}`}
                          >
                            {creator.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{creator.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No creators assigned</p>
                  </div>
                )}
                
                {isAdmin && (
                  <button
                    onClick={openCreatorModal}
                    className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
                  >
                    Manage Creators
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Team Member</h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                {userSearchQuery && !loadingAvailableUsers && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {filteredAvailableUsers.length} user{filteredAvailableUsers.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select User
                </label>
                
                {loadingAvailableUsers ? (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 overflow-hidden">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-600 last:border-b-0 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading available users...
                      </div>
                    </div>
                  </div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {userSearchQuery ? 'No users found' : 'No available users'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userSearchQuery ? 'Try adjusting your search terms' : 'All users are already team members'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                    {filteredAvailableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                          selectedUserId === user.id 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30' 
                            : ''
                        }`}
                      >
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium truncate ${
                              selectedUserId === user.id 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {user.name || 'Unnamed User'}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN' 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : user.role === 'MODERATOR'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <p className={`text-sm truncate mt-1 ${
                            selectedUserId === user.id 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {user.email}
                          </p>
                        </div>
                        
                        {/* Selection Indicator */}
                        {selectedUserId === user.id && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              {selectedUserId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'MEMBER', label: 'Member', color: 'gray', icon: User },
                      { value: 'MODERATOR', label: 'Moderator', color: 'yellow', icon: Shield },
                      { value: 'ADMIN', label: 'Admin', color: 'red', icon: UserCheck }
                    ].map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.value}
                          onClick={() => setSelectedUserRole(role.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            selectedUserRole === role.value
                              ? role.color === 'gray' 
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                                : role.color === 'yellow'
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{role.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addMemberToTeam}
                disabled={!selectedUserId || addingMember}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingMember ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Remove Member</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove <strong>{showRemoveMemberConfirm.memberName}</strong> from this team?
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveMemberConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMemberFromTeam(showRemoveMemberConfirm.memberId)}
                disabled={removingMember === showRemoveMemberConfirm.memberId}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {removingMember === showRemoveMemberConfirm.memberId ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Multi-Select Notification Assignment Modal */}
      {showAssignNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Add to {showAssignNotificationModal.columnLabel} Notifications
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Select team members to receive notifications when tasks move to this column
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignNotificationModal(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={notificationSearchQuery}
                    onChange={(e) => setNotificationSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {notificationSearchQuery && (
                    <button
                      onClick={() => setNotificationSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Selection Controls */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNotificationUsers.length} selected
                  </div>
                  
                  {(() => {
                    const availableMembers = getAvailableMembersForColumn(showAssignNotificationModal.columnId).filter(member =>
                      notificationSearchQuery === "" || 
                      member.name?.toLowerCase().includes(notificationSearchQuery.toLowerCase()) ||
                      member.email?.toLowerCase().includes(notificationSearchQuery.toLowerCase())
                    );
                    
                    const allSelected = availableMembers.length > 0 && 
                      availableMembers.every(member => selectedNotificationUsers.includes(member.userId || member.id));
                    
                    return availableMembers.length > 0 && (
                      <button
                        onClick={() => toggleAllNotificationUsers(availableMembers)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {allSelected ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4" />
                            Select All
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const availableMembers = getAvailableMembersForColumn(showAssignNotificationModal.columnId).filter(member =>
                  notificationSearchQuery === "" || 
                  member.name?.toLowerCase().includes(notificationSearchQuery.toLowerCase()) ||
                  member.email?.toLowerCase().includes(notificationSearchQuery.toLowerCase())
                );

                if (availableMembers.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                        {notificationSearchQuery ? 'No members found' : 'Everyone\'s Already Added!'}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400">
                        {notificationSearchQuery 
                          ? 'Try adjusting your search terms'
                          : 'All team members are already getting notifications for this column.'
                        }
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-3">
                    {availableMembers.map((member) => {
                      const userId = member.userId || member.id;
                      const isSelected = selectedNotificationUsers.includes(userId);
                      
                      return (
                        <button
                          key={member.id}
                          onClick={() => toggleNotificationUserSelection(userId)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || 'User'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold truncate ${
                                isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {member.name || 'Unnamed User'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.role === 'ADMIN' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : member.role === 'MODERATOR'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <p className={`text-sm truncate mt-1 ${
                              isSelected 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {member.email}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedNotificationUsers.length} member{selectedNotificationUsers.length !== 1 ? 's' : ''} selected
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAssignNotificationModal(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => assignMembersToColumn(showAssignNotificationModal.columnId, selectedNotificationUsers)}
                    disabled={selectedNotificationUsers.length === 0 || assigningNotification}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigningNotification ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Add Members
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Creator Management Modal */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Manage Team Creators
                  </h3>
                  <p className="text-pink-100 text-sm">
                    Select creators to assign to this team ({selectedCount} of {totalCount} selected)
                  </p>
                </div>
                <button
                  onClick={() => setShowCreatorModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Creator Selection */}
              <div className="flex-1 flex flex-col">
                {/* Search and Stats */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={creatorSearchQuery}
                        onChange={(e) => {
                          setCreatorSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search creators..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {creatorSearchQuery ? (
                          <span>{filteredCount} of {totalCount} creators</span>
                        ) : (
                          <span>{totalCount} total creators</span>
                        )}
                      </div>
                      
                      {filteredCreators.length > 0 && (
                        <button
                          onClick={() => toggleAllCreators(paginatedCreators)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          {paginatedCreators.every(creator => selectedCreators.includes(creator.name)) ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-pink-600" />
                              Deselect Page
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4" />
                              Select Page
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Creator List */}
                <div className="flex-1 overflow-y-auto p-6">
              {loadingCreators ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading creators...</span>
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {creatorSearchQuery ? 'No creators found' : 'No creators available'}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    {creatorSearchQuery ? 'Try adjusting your search terms' : 'No creators have been added to the system yet'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {paginatedCreators.map((creator) => {
                      const isSelected = selectedCreators.includes(creator.name);
                      return (
                        <button
                          key={creator.id}
                          onClick={() => toggleCreatorSelection(creator.name)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-900/10'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-pink-500 bg-pink-500'
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          
                          {/* Creator Avatar */}
                          <div className="flex-shrink-0">
                            {processImageUrl(creator.image) ? (
                              <img
                                src={processImageUrl(creator.image)!}
                                alt={creator.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  // Fallback on error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-medium text-sm ${processImageUrl(creator.image) ? 'hidden' : ''}`}
                            >
                              {creator.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${
                              isSelected
                                ? 'text-pink-700 dark:text-pink-300'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {creator.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = currentPage <= 3 
                              ? i + 1 
                              : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;
                            
                            if (pageNum < 1 || pageNum > totalPages) return null;
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-pink-500 text-white'
                                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
                </div>
              </div>

              {/* Right Panel - Selected Creators */}
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-pink-600" />
                    Selected Creators ({selectedCount})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    These creators will be assigned to the team
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedCount === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Star className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No creators selected yet. Select creators from the left to see them here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCreators.map((creatorName) => {
                        const creatorObj = availableCreators.find(c => c.name === creatorName);
                        return (
                          <div
                            key={creatorName}
                            className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-500/30 rounded-lg group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Creator Avatar */}
                              <div className="flex-shrink-0">
                                {processImageUrl(creatorObj?.image) ? (
                                  <img
                                    src={processImageUrl(creatorObj?.image)!}
                                    alt={creatorName}
                                    className="w-6 h-6 rounded-full object-cover border border-pink-200 dark:border-pink-400"
                                    onError={(e) => {
                                      // Fallback on error
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white font-medium text-xs ${processImageUrl(creatorObj?.image) ? 'hidden' : ''}`}
                                >
                                  {creatorName.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <span className="text-sm font-medium text-pink-700 dark:text-pink-300 truncate">
                                {creatorName}
                              </span>
                            </div>
                          <button
                            onClick={() => toggleCreatorSelection(creatorName)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200 transition-all"
                            title={`Remove ${creatorName}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        );
                      })}
                      
                      {selectedCount > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => setSelectedCreators([])}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCount} creator{selectedCount !== 1 ? 's' : ''} selected
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreatorModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => updateTeamCreators(selectedCreators)}
                    disabled={updatingCreators}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingCreators ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSettings;