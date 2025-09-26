"use client";

import React, { useState } from "react";
import { X, Plus, Users } from "lucide-react";

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string | null;
  availableUsers: SystemUser[];
  onAddMembers: (teamId: string, userIds: string[], roles: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  availableUsers,
  onAddMembers,
  isLoading = false,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<SystemUser[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !teamId) return null;

  const filteredUsers = availableUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (user: SystemUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        const newRoles = { ...userRoles };
        delete newRoles[user.id];
        setUserRoles(newRoles);
        return prev.filter(u => u.id !== user.id);
      } else {
        setUserRoles(prev => ({ ...prev, [user.id]: "Member" }));
        return [...prev, user];
      }
    });
  };

  const handleRoleChange = (userId: string, role: string) => {
    setUserRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    try {
      await onAddMembers(
        teamId,
        selectedUsers.map(u => u.id),
        userRoles
      );
      setSelectedUsers([]);
      setUserRoles({});
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error adding members:", error);
    }
  };

  const isUserSelected = (user: SystemUser) => {
    return selectedUsers.some(u => u.id === user.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-4 sm:my-8">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                Add Team Members
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select users to add to this team
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Search */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* User List */}
          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const selected = isUserSelected(user);
                  const userRole = userRoles[user.id] || "Member";

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        selected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => handleUserToggle(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {(user.name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name || "No Name"}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {selected && (
                        <select
                          value={userRole}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRoleChange(user.id, e.target.value);
                          }}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Member">Member</option>
                          <option value="Lead">Lead</option>
                          <option value="Manager">Manager</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Try a different search term." : "No available users to add."}
                </p>
              </div>
            )}
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="px-4 sm:px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0 || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Members ({selectedUsers.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};