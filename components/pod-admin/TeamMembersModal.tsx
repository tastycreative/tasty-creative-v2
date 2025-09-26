"use client";

import React from "react";
import { X, Plus, UserMinus, Edit, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  image?: string;
  userId?: string;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onAddMember: (teamId: string) => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
  onEditMember: (teamId: string, memberId: string) => void;
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  isOpen,
  onClose,
  team,
  onAddMember,
  onRemoveMember,
  onEditMember,
}) => {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-4 sm:my-8">
        {/* Modal Header */}
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
              <button
                onClick={() => onAddMember(team.id)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
          {team.members.length > 0 ? (
            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </h4>
                      {member.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {member.email}
                        </p>
                      )}
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full mt-1">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onEditMember(team.id, member.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit member"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveMember(team.id, member.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Plus className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No members yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by adding your first team member.
              </p>
              <button
                onClick={() => onAddMember(team.id)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Member</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};