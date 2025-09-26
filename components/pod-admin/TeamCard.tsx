"use client";

import React, { useState } from "react";
import {
  Edit,
  Save,
  X,
  Plus,
  Star,
  MoreHorizontal,
  Users,
  ClipboardList,
  Eye,
  UserPlus,
  Calendar,
  Clock,
  ChevronDown,
  Target,
  Bell,
} from "lucide-react";

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

interface TeamCardProps {
  team: Team;
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

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
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
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [editingTeamNameValue, setEditingTeamNameValue] = useState("");
  const [editingTeamPrefix, setEditingTeamPrefix] = useState(false);
  const [editingTeamPrefixValue, setEditingTeamPrefixValue] = useState("");
  const [editingCreators, setEditingCreators] = useState(false);
  const [editingCreatorsValue, setEditingCreatorsValue] = useState<string[]>([]);
  const [showTeamMenu, setShowTeamMenu] = useState(false);

  const stats = getTeamStats(team);

  const handleUpdateTeamName = () => {
    onUpdateTeamName(team.id, editingTeamNameValue);
    setEditingTeamName(false);
    setEditingTeamNameValue("");
  };

  const handleUpdateTeamPrefix = () => {
    onUpdateTeamPrefix(team.id, editingTeamPrefixValue);
    setEditingTeamPrefix(false);
    setEditingTeamPrefixValue("");
  };

  const handleUpdateCreators = () => {
    onUpdateTeamCreators(team.id, editingCreatorsValue);
    setEditingCreators(false);
    setEditingCreatorsValue([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Team Name Section */}
          {editingTeamName ? (
            <div className="flex items-center space-x-2 mb-1">
              <input
                type="text"
                value={editingTeamNameValue}
                onChange={(e) => setEditingTeamNameValue(e.target.value)}
                className="text-lg font-semibold bg-transparent border-b-2 border-purple-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-600 flex-1"
                placeholder="Team name"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateTeamName();
                  } else if (e.key === "Escape") {
                    setEditingTeamName(false);
                    setEditingTeamNameValue("");
                  }
                }}
              />
              <button
                onClick={handleUpdateTeamName}
                disabled={updatingStates.teamName === team.id}
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
              >
                {updatingStates.teamName === team.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingTeamName(false);
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
                  setEditingTeamName(true);
                  setEditingTeamNameValue(team.name);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit team name"
              >
                <Edit className="h-4 w-4" />
              </button>
              {successStates.teamName === team.id && (
                <span className="text-green-600 dark:text-green-400 text-sm">
                  ✓ Updated
                </span>
              )}
            </div>
          )}

          {/* Project Prefix Section */}
          {editingTeamPrefix ? (
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={editingTeamPrefixValue}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 5);
                  if (/^[A-Z0-9]*$/.test(value)) {
                    setEditingTeamPrefixValue(value);
                  }
                }}
                placeholder="e.g. ABC"
                className="px-2 py-1 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                maxLength={5}
                autoFocus
              />
              <button
                onClick={handleUpdateTeamPrefix}
                disabled={
                  !editingTeamPrefixValue.trim() ||
                  editingTeamPrefixValue.length < 3 ||
                  updatingStates.teamPrefix === team.id
                }
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
              >
                {updatingStates.teamPrefix === team.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingTeamPrefix(false);
                  setEditingTeamPrefixValue("");
                }}
                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Project Prefix:
              </span>
              {team.projectPrefix ? (
                <>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-mono rounded">
                    {team.projectPrefix}
                  </span>
                  <button
                    onClick={() => {
                      setEditingTeamPrefix(true);
                      setEditingTeamPrefixValue(team.projectPrefix || "");
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Edit project prefix"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">
                    None
                  </span>
                  <button
                    onClick={() => {
                      setEditingTeamPrefix(true);
                      setEditingTeamPrefixValue("");
                    }}
                    className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    title="Add project prefix"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </>
              )}
              {successStates.teamPrefix === team.id && (
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
            {editingCreators ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Assigned Creators:
                  </label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700">
                    {availableCreators.length > 0 ? (
                      availableCreators.map((creator) => {
                        const isSelected = editingCreatorsValue.includes(creator);
                        const canSelect = editingCreatorsValue.length < 3 || isSelected;
                        
                        return (
                          <button
                            key={creator}
                            type="button"
                            onClick={() => {
                              if (!canSelect) return;
                              setEditingCreatorsValue((prev) =>
                                isSelected
                                  ? prev.filter((c) => c !== creator)
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
                            title={!canSelect ? "Maximum 3 creators allowed" : ""}
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
                    Select up to 3 creators ({editingCreatorsValue.length}/3 selected)
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUpdateCreators}
                    disabled={updatingStates.creators === team.id}
                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {updatingStates.creators === team.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCreators(false);
                      setEditingCreatorsValue([]);
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <Star className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Creators:
                  </span>
                  {team.creators && team.creators.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
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
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingCreators(true);
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
                  {successStates.creators === team.id && (
                    <span className="text-green-600 dark:text-green-400 text-xs animate-pulse">
                      ✓ Updated
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Menu */}
        <div className="relative team-menu-container">
          <button
            onClick={() => setShowTeamMenu(!showTeamMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>

          {showTeamMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button
                onClick={() => {
                  setEditingTeamName(true);
                  setEditingTeamNameValue(team.name);
                  setShowTeamMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Team Name</span>
              </button>
              <button
                onClick={() => {
                  setEditingCreators(true);
                  setEditingCreatorsValue(team.creators || []);
                  if (availableCreators.length === 0) {
                    fetchAvailableCreators();
                  }
                  setShowTeamMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Star className="h-4 w-4" />
                <span>Edit Creators</span>
              </button>
              <button
                onClick={() => {
                  onShowMembers(team.id);
                  setShowTeamMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Manage Members</span>
              </button>
              <button
                onClick={() => {
                  onShowTasks(team.id);
                  setShowTeamMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Manage Tasks</span>
              </button>
              <button
                onClick={() => {
                  onShowColumnAssignments(team.id);
                  setShowTeamMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Target className="h-4 w-4" />
                <span>Column Assignments</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Members
            </span>
          </div>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {team.members.length}
          </p>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Tasks
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            {stats.totalTasks}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Done
            </span>
          </div>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {stats.completedTasks}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              In Progress
            </span>
          </div>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {stats.inProgressTasks}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onShowMembers(team.id)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
        >
          <Users className="h-4 w-4" />
          <span>Members ({team.members.length})</span>
        </button>
        
        <button
          onClick={() => onShowTasks(team.id)}
          className="flex items-center space-x-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Tasks ({stats.totalTasks})</span>
        </button>
        
        <button
          onClick={() => onShowColumnAssignments(team.id)}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm"
        >
          <Target className="h-4 w-4" />
          <span>Columns</span>
        </button>
      </div>
    </div>
  );
};