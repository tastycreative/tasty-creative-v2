"use client";

import React from "react";
import {
  ExternalLink,
  Check,
  X as XIcon,
  Edit2,
  Loader2,
  Instagram,
  Twitter,
  Video,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditingState } from "./utils";

interface SocialLink {
  icon: any;
  platform: string;
  username: string | undefined;
  url: string | undefined;
  color: string;
}

interface ModelSocialsProps {
  socialLinks: SocialLink[];
  isAdmin: boolean;
  editingCell: EditingState | null;
  setEditingCell: (state: EditingState | null) => void;
  handleEditValueChange: (value: string) => void;
  handleContentDetailsEditSave: () => void;
  updatingContent: boolean;
  resolvedCreatorName: string | null;
}

export const ModelSocials: React.FC<ModelSocialsProps> = ({
  socialLinks,
  isAdmin,
  editingCell,
  setEditingCell,
  handleEditValueChange,
  handleContentDetailsEditSave,
  updatingContent,
  resolvedCreatorName,
}) => {
  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-blue-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full translate-y-8 -translate-x-8 blur-xl"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-xl border border-blue-200/50 dark:border-blue-500/30">
            <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-black tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-pink-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Social Links
            </span>
          </h3>
        </div>
        <div className="space-y-3">
          {socialLinks.map((link, idx) => {
            const Icon = link.icon;
            const fieldName = `Main ${link.platform}`;
            const currentUsername = link.username || "";

            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-colors"
              >
                <Icon className={cn("w-5 h-5", link.color)} />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm">{link.platform}</p>
                    {currentUsername && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {isAdmin &&
                  editingCell &&
                  editingCell.creatorName === (resolvedCreatorName || "") &&
                  editingCell.itemName === fieldName ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editingCell.newValue}
                        onChange={(e) => handleEditValueChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        autoFocus
                        placeholder={`Enter ${link.platform} username...`}
                      />
                      <button
                        onClick={handleContentDetailsEditSave}
                        disabled={updatingContent}
                        className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingContent ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingCell(null)}
                        disabled={updatingContent}
                        className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        isAdmin
                          ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-1 py-0.5 rounded"
                          : ""
                      }`}
                      onClick={() =>
                        isAdmin &&
                        setEditingCell({
                          creatorName: resolvedCreatorName || "",
                          itemName: fieldName,
                          originalValue: currentUsername,
                          newValue: currentUsername,
                        })
                      }
                    >
                      <p className="text-xs text-muted-foreground flex-1">
                        {currentUsername || `No ${link.platform} set`}
                      </p>
                      {isAdmin && (
                        <Edit2 className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
