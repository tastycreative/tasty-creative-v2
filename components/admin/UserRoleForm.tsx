"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";
import { Edit2, Save, X } from "lucide-react";

type Role = "GUEST" | "USER" | "MODERATOR" | "ADMIN";

interface UserRoleFormProps {
  userId: string;
  currentRole: Role;
  userName: string;
  isCurrentUser: boolean;
}

export function UserRoleForm({
  userId,
  currentRole,
  isCurrentUser,
}: UserRoleFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, selectedRole);
        setIsEditing(false);
        // Optionally show a success toast here
      } catch (error) {
        console.error("Failed to update role:", error);
        // Optionally show an error toast here
      }
    });
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        disabled={isCurrentUser}
        className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isCurrentUser ? "You cannot change your own role" : "Change role"
        }
      >
        <Edit2 className="h-4 w-4 mr-1" />
        Edit
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as Role)}
        disabled={isPending}
        className="block px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
      >
        <option value="GUEST">Guest</option>
        <option value="USER">User</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={isPending || selectedRole === currentRole}
        className="inline-flex items-center px-3 py-1 text-sm bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="h-3 w-3 mr-1 text-pink-400" />
        {isPending ? "Saving..." : "Save"}
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setSelectedRole(currentRole);
        }}
        disabled={isPending}
        className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <X className="h-3 w-3 mr-1" />
        Cancel
      </button>
    </div>
  );
}