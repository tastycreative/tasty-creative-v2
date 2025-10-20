"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";
import { Edit2, Save, X } from "lucide-react";
import { notifyRoleChange } from "@/lib/session-sync";
import { useQueryClient } from "@tanstack/react-query";

type Role = "GUEST" | "USER" | "MODERATOR" | "ADMIN" | "SWD" | "POD";

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
  const queryClient = useQueryClient();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const result = await updateUserRole(userId, selectedRole);
        setIsEditing(false);

        // If there's a role change notification, broadcast it
        if (result.roleChangeNotification) {
          notifyRoleChange(result.roleChangeNotification);
        }

        // Invalidate and refetch all admin-users queries to immediately reflect the change
        await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        await queryClient.refetchQueries({ queryKey: ['admin-users'] });
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
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="flex items-center space-x-1 min-w-0">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as Role)}
        disabled={isPending}
        className="block px-2 py-1 text-xs rounded border border-pink-200 dark:border-pink-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all min-w-[90px] max-w-[120px]"
      >
        <option value="GUEST">Guest</option>
        <option value="USER">User</option>
        <option value="POD">POD</option>
        <option value="SWD">SWD</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={isPending || selectedRole === currentRole}
        className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
        title={isPending ? "Saving..." : "Save changes"}
      >
        <Save className="h-3 w-3" />
        <span className="hidden sm:inline ml-1">{isPending ? "..." : "Save"}</span>
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setSelectedRole(currentRole);
        }}
        disabled={isPending}
        className="inline-flex items-center px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
        title="Cancel editing"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
