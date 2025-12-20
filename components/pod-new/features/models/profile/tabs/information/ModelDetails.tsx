"use client";

import React from "react";
import {
  Globe,
  Check,
  X as XIcon,
  Edit2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditingState } from "./utils";

interface ModelDetailsProps {
  resolvedCreatorName: string | null;
  isAdmin: boolean;
  editingCell: EditingState | null;
  setEditingCell: (state: EditingState | null) => void;
  handleEditValueChange: (value: string) => void;
  handleContentDetailsEditSave: () => void;
  updatingContent: boolean;
  personalityText: string | undefined;
  referrerText: string;
  runtimeContext: any;
  derivedCommonTerms: string[];
  derivedCommonEmojis: string[];
}

export const ModelDetails: React.FC<ModelDetailsProps> = ({
  resolvedCreatorName,
  isAdmin,
  editingCell,
  setEditingCell,
  handleEditValueChange,
  handleContentDetailsEditSave,
  updatingContent,
  personalityText,
  referrerText,
  runtimeContext,
  derivedCommonTerms,
  derivedCommonEmojis,
}) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="relative group overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full translate-y-10 -translate-x-10 blur-xl"></div>
        </div>

        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
              <Globe className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-lg font-black tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-pink-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                Personal Information
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personality Type - Editable */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Personality Type
                </label>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Personality Type" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    <button
                      onClick={handleContentDetailsEditSave}
                      disabled={updatingContent}
                      className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCell(null)}
                      disabled={updatingContent}
                      className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p
                    className={`font-semibold ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Personality Type",
                        originalValue: personalityText || "",
                        newValue: personalityText || "",
                      })
                    }
                  >
                    {personalityText}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </p>
                )}
              </div>

              {/* Referrer - NOT Editable */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Referrer
                </label>
                <p className="font-semibold">{referrerText}</p>
              </div>

              {/* Restricted Terms or Emojis - Editable */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Restricted Terms or Emojis
                </label>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Restricted Terms or Emojis" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                      placeholder="Enter restricted terms or emojis..."
                    />
                    <button
                      onClick={handleContentDetailsEditSave}
                      disabled={updatingContent}
                      className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCell(null)}
                      disabled={updatingContent}
                      className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p
                    className={`font-semibold ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Restricted Terms or Emojis",
                        originalValue:
                          runtimeContext?.contentDetails?.restrictedTerms || "",
                        newValue:
                          runtimeContext?.contentDetails?.restrictedTerms || "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails?.restrictedTerms || "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </p>
                )}
              </div>

              {/* Notes - Editable */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Notes
                </label>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Notes" ? (
                  <div className="flex items-center gap-1">
                    <textarea
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                      rows={3}
                      placeholder="Enter notes..."
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleContentDetailsEditSave}
                        disabled={updatingContent}
                        className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingContent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingCell(null)}
                        disabled={updatingContent}
                        className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={`font-semibold ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Notes",
                        originalValue:
                          runtimeContext?.contentDetails?.notes || "",
                        newValue: runtimeContext?.contentDetails?.notes || "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails?.notes || "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* General client notes/requests - Full width */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                General Client Notes/Requests
              </label>
              {isAdmin &&
              editingCell &&
              editingCell.creatorName === (resolvedCreatorName || "") &&
              editingCell.itemName === "General Client Notes/Requests" ? (
                <div className="flex items-start gap-1 mt-2">
                  <textarea
                    value={editingCell.newValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                    rows={4}
                    placeholder="Enter general client notes or requests..."
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleContentDetailsEditSave}
                      disabled={updatingContent}
                      className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCell(null)}
                      disabled={updatingContent}
                      className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${
                    isAdmin
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      : ""
                  }`}
                  onClick={() =>
                    isAdmin &&
                    setEditingCell({
                      creatorName: resolvedCreatorName || "",
                      itemName: "General Client Notes/Requests",
                      originalValue:
                        runtimeContext?.contentDetails?.generalClientNotes ||
                        "",
                      newValue:
                        runtimeContext?.contentDetails?.generalClientNotes ||
                        "",
                    })
                  }
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {runtimeContext?.contentDetails?.generalClientNotes ||
                      "No notes or requests yet..."}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Common Terms
              </label>
              {isAdmin &&
              editingCell &&
              editingCell.creatorName === (resolvedCreatorName || "") &&
              editingCell.itemName === "Common Terms" ? (
                <div className="flex items-start gap-1">
                  <textarea
                    value={editingCell.newValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                    rows={3}
                    placeholder="Enter common terms separated by spaces..."
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleContentDetailsEditSave}
                      disabled={updatingContent}
                      className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCell(null)}
                      disabled={updatingContent}
                      className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${
                    isAdmin
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                      : ""
                  }`}
                  onClick={() =>
                    isAdmin &&
                    setEditingCell({
                      creatorName: resolvedCreatorName || "",
                      itemName: "Common Terms",
                      originalValue: runtimeContext?.commonTerms || "",
                      newValue: runtimeContext?.commonTerms || "",
                    })
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {derivedCommonTerms.map((term, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-primary/5"
                      >
                        #{term}
                      </Badge>
                    ))}
                    {derivedCommonTerms.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No common terms set
                      </span>
                    )}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Common Emojis
              </label>
              {isAdmin &&
              editingCell &&
              editingCell.creatorName === (resolvedCreatorName || "") &&
              editingCell.itemName === "Common Emojis" ? (
                <div className="flex items-start gap-1">
                  <textarea
                    value={editingCell.newValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                    rows={2}
                    placeholder="Enter common emojis..."
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleContentDetailsEditSave}
                      disabled={updatingContent}
                      className="p-1 text-green-600 hover:text-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingCell(null)}
                      disabled={updatingContent}
                      className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${
                    isAdmin
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                      : ""
                  }`}
                  onClick={() =>
                    isAdmin &&
                    setEditingCell({
                      creatorName: resolvedCreatorName || "",
                      itemName: "Common Emojis",
                      originalValue: runtimeContext?.commonEmojis || "",
                      newValue: runtimeContext?.commonEmojis || "",
                    })
                  }
                >
                  <div className="flex gap-2 text-2xl">
                    {derivedCommonEmojis.map((emoji, idx) => (
                      <span key={idx}>{emoji}</span>
                    ))}
                    {derivedCommonEmojis.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No common emojis set
                      </span>
                    )}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
