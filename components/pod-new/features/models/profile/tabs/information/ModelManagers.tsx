"use client";

import React from "react";
import { Users, Check, X as XIcon, Edit2, Loader2, Plus } from "lucide-react";
import { EditingState } from "./utils";

interface ModelManagersProps {
  chattingManagers: string[];
  isAdmin: boolean;
  editingCell: EditingState | null;
  setEditingCell: (state: EditingState | null) => void;
  // Modified to accept an optional state override for immediate saving
  handleContentDetailsEditSave: (overrideState?: EditingState) => Promise<void>;
  updatingContent: boolean;
  resolvedCreatorName: string | null;
  handleEditValueChange: (value: string) => void;
}

export const ModelManagers: React.FC<ModelManagersProps> = ({
  chattingManagers,
  isAdmin,
  editingCell,
  setEditingCell,
  handleContentDetailsEditSave,
  updatingContent,
  resolvedCreatorName,
  handleEditValueChange,
}) => {
  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-orange-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full translate-y-8 -translate-x-8 blur-xl"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 rounded-xl border border-orange-200/50 dark:border-orange-500/30">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-black tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-orange-600 to-amber-600 dark:from-pink-100 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
              Chatting Managers
            </span>
          </h3>
        </div>

        {/* Chatting Managers List */}
        <div className="space-y-3">
          {/* Current Managers */}
          {chattingManagers.map((manager, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {manager.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === `Manager-${idx}` ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                      placeholder="Manager name..."
                    />
                    <button
                      onClick={async () => {
                        const currentManagers = [...chattingManagers];
                        currentManagers[idx] = editingCell.newValue;
                        const newState = {
                          creatorName: resolvedCreatorName || "",
                          itemName: "Chatting Managers",
                          originalValue: currentManagers.join("\n"),
                          newValue: currentManagers.join("\n"),
                        };
                        setEditingCell(newState); // Optimistic UI update
                        await handleContentDetailsEditSave(newState);
                      }}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{manager}</p>
                      <p className="text-xs text-muted-foreground">Manager</p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({
                              creatorName: resolvedCreatorName || "",
                              itemName: `Manager-${idx}`,
                              originalValue: manager,
                              newValue: manager,
                            });
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 rounded"
                          title="Edit manager"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentManagers = [...chattingManagers];
                            currentManagers.splice(idx, 1);
                            const newState = {
                              creatorName: resolvedCreatorName || "",
                              itemName: "Chatting Managers",
                              originalValue: currentManagers.join("\n"),
                              newValue: currentManagers.join("\n"),
                            };
                            setEditingCell(newState);
                            await handleContentDetailsEditSave(newState);
                          }}
                          disabled={updatingContent}
                          className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove manager"
                        >
                          {updatingContent ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XIcon className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Manager */}
          {isAdmin && (
            <div>
              {editingCell &&
              editingCell.creatorName === (resolvedCreatorName || "") &&
              editingCell.itemName === "Add-Manager" ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border-2 border-dashed border-primary/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                      placeholder="New manager name..."
                    />
                    <button
                      onClick={async () => {
                        const currentManagers = [...chattingManagers];
                        currentManagers.push(editingCell.newValue);
                        const newState = {
                          creatorName: resolvedCreatorName || "",
                          itemName: "Chatting Managers",
                          originalValue: currentManagers.join("\n"),
                          newValue: currentManagers.join("\n"),
                        };
                        setEditingCell(newState);
                        await handleContentDetailsEditSave(newState);
                      }}
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
                </div>
              ) : (
                <button
                  onClick={() =>
                    setEditingCell({
                      creatorName: resolvedCreatorName || "",
                      itemName: "Add-Manager",
                      originalValue: "",
                      newValue: "",
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Manager</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
