"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";

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
        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isCurrentUser ? "You cannot change your own role" : "Change role"
        }
      >
        Change Role
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as Role)}
        disabled={isPending}
        className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
      >
        <option value="GUEST">Guest</option>
        <option value="USER">User</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={isPending || selectedRole === currentRole}
        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setSelectedRole(currentRole);
        }}
        disabled={isPending}
        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        Cancel
      </button>
    </div>
  );
}
