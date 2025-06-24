"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";
import {
  Settings,
  X,
  Users,
  AlertCircle,
  Save,
  ChevronDown,
  UserPlus,
} from "lucide-react";

type Role = "GUEST" | "USER" | "MODERATOR" | "ADMIN" | "SWD";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

interface BulkRoleEditorProps {
  users: User[];
}

export function BulkRoleEditor({ users }: BulkRoleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<Role>("USER");
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "ALL" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleBulkUpdate = () => {
    if (selectedUsers.size === 0) return;
    setShowConfirmation(true);
  };

  const confirmBulkUpdate = () => {
    startTransition(async () => {
      try {
        const promises = Array.from(selectedUsers).map((userId) =>
          updateUserRole(userId, selectedRole)
        );
        await Promise.all(promises);

        setSelectedUsers(new Set());
        setShowConfirmation(false);
        setIsOpen(false);
        // Optionally show success toast
      } catch (error) {
        console.error("Failed to bulk update roles:", error);
        // Optionally show error toast
      }
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "🛡️";
      case "MODERATOR":
        return "⚖️";
      case "SWD":
        return "✍️";
      case "USER":
        return "👤";
      case "GUEST":
        return "👋";
      default:
        return "❓";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-black text-white";
      case "MODERATOR":
        return "bg-yellow-100 text-yellow-800";
      case "SWD":
        return "bg-purple-100 text-purple-800";
      case "USER":
        return "bg-green-100 text-green-800";
      case "GUEST":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
      >
        <Settings className="h-4 w-4 mr-2" />
        Bulk Edit Roles
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsOpen(false)}
            />

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Settings className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Bulk Role Editor
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select users and assign roles in bulk
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filters and Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filterRole}
                      onChange={(e) =>
                        setFilterRole(e.target.value as Role | "ALL")
                      }
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="GUEST">Guest</option>
                      <option value="USER">User</option>
                      <option value="SWD">SWD</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      {selectedUsers.size === filteredUsers.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                    <span className="text-sm text-gray-500">
                      {selectedUsers.size} selected
                    </span>
                  </div>

                  {selectedUsers.size > 0 && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">Change to:</span>
                      <select
                        value={selectedRole}
                        onChange={(e) =>
                          setSelectedRole(e.target.value as Role)
                        }
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="GUEST">Guest</option>
                        <option value="USER">User</option>
                        <option value="SWD">SWD (Script Writer)</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={handleBulkUpdate}
                        disabled={isPending}
                        className="inline-flex items-center px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Update Roles
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Users ({filteredUsers.length})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedUsers.has(user.id)
                          ? "bg-pink-50 border-l-4 border-pink-500"
                          : ""
                      }`}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            />
                          </div>

                          {user.image ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                              alt={user.name || ""}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {(
                                  user.name?.[0] ||
                                  user.email?.[0] ||
                                  "?"
                                ).toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "No name"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {getRoleIcon(user.role)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                          >
                            {user.role === "SWD" ? "Script Writer" : user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">
                      No users found matching your criteria
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Bulk Role Change
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  You are about to change the role of {selectedUsers.size}{" "}
                  user(s) to{" "}
                  <span className="font-medium text-gray-900">
                    {selectedRole === "SWD" ? "Script Writer" : selectedRole}
                  </span>
                  .
                </p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      This action cannot be undone. Make sure you want to
                      proceed with this bulk operation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkUpdate}
                  disabled={isPending}
                  className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-2" />
                      Confirm Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
