"use client";

import React from "react";
import { Users, AlertCircle, FolderX } from "lucide-react";

interface NoTeamSelectedProps {
  variant?: "select" | "no-access" | "no-teams" | "no-projects" | "loading";
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showBackground?: boolean;
}

export default function NoTeamSelected({ 
  variant = "select", 
  title, 
  description, 
  icon,
  showBackground = true 
}: NoTeamSelectedProps) {
  // Default configurations for different variants
  const variants = {
    select: {
      title: title || "Please Select a Team",
      description: description || "Choose a team from the dropdown to view the board and start collaborating.",
      icon: icon || <Users className="h-8 w-8 text-blue-500" />,
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-500/30",
      textColor: "text-blue-700 dark:text-blue-400"
    },
    "no-access": {
      title: title || "Access Restricted",
      description: description || "You don't have permission to view this team's content. Only team members and administrators can access this.",
      icon: icon || <AlertCircle className="h-8 w-8 text-yellow-500" />,
      bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
      borderColor: "border-yellow-200 dark:border-yellow-500/30",
      textColor: "text-yellow-700 dark:text-yellow-400"
    },
    "no-teams": {
      title: title || "No Teams Available",
      description: description || "You're not a member of any teams yet. Contact an administrator to get added to a team.",
      icon: icon || <Users className="h-8 w-8 text-gray-500" />,
      bgColor: "bg-gray-50 dark:bg-gray-900/30",
      borderColor: "border-gray-200 dark:border-gray-500/30",
      textColor: "text-gray-700 dark:text-gray-400"
    },
    "no-projects": {
      title: title || "No Assigned Projects",
      description: description || "You don't have any assigned projects or team access. Please contact your administrator to get assigned to a team and projects.",
      icon: icon || <FolderX className="h-8 w-8 text-orange-500" />,
      bgColor: "bg-orange-50 dark:bg-orange-900/30",
      borderColor: "border-orange-200 dark:border-orange-500/30",
      textColor: "text-orange-700 dark:text-orange-400"
    },
    loading: {
      title: title || "Loading Teams...",
      description: description || "Please wait while we load your team information.",
      icon: icon || (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      ),
      bgColor: "bg-gray-50 dark:bg-gray-900/30",
      borderColor: "border-gray-200 dark:border-gray-500/30",
      textColor: "text-gray-700 dark:text-gray-400"
    }
  };

  const config = variants[variant];

  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${config.textColor}`}>
          {config.title}
        </h3>
        <p className={`text-sm ${config.textColor.replace('700', '600').replace('400', '500')} max-w-md`}>
          {config.description}
        </p>
      </div>
    </div>
  );

  if (!showBackground) {
    return content;
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg`}>
      {content}
    </div>
  );
}