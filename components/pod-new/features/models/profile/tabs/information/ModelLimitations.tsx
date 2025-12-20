"use client";

import React from "react";
import {
  Globe,
  ChevronDown,
  Check,
  X as XIcon,
  Edit2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EditingState } from "./utils";

interface ModelLimitationsProps {
  runtimeContext: any;
  isAdmin: boolean;
  editingCell: EditingState | null;
  setEditingCell: (state: EditingState | null) => void;
  handleEditValueChange: (value: string) => void;
  handleContentDetailsEditSave: () => void;
  updatingContent: boolean;
  resolvedCreatorName: string | null;
}

export const ModelLimitations: React.FC<ModelLimitationsProps> = ({
  runtimeContext,
  isAdmin,
  editingCell,
  setEditingCell,
  handleEditValueChange,
  handleContentDetailsEditSave,
  updatingContent,
  resolvedCreatorName,
}) => {
  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-yellow-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
      <div className="relative p-4">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Platform Limitations</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2 text-sm">
              {/* OnlyFans Wall Limitations */}
              <div className="flex justify-between items-center">
                <span>OnlyFans Wall Limitations</span>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "OnlyFans Wall Limitations" ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    >
                      <option value="">Select option...</option>
                      <option value="No nudity">No nudity</option>
                      <option value="Shows everything">Shows everything</option>
                      <option value="Topless">Topless</option>
                      <option value="Topless on VIP page">
                        Topless on VIP page
                      </option>
                    </select>
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
                  <span
                    className={`text-amber-600 font-medium ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "OnlyFans Wall Limitations",
                        originalValue:
                          runtimeContext?.contentDetails
                            ?.onlyFansWallLimitations || "",
                        newValue:
                          runtimeContext?.contentDetails
                            ?.onlyFansWallLimitations || "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails?.onlyFansWallLimitations ||
                      "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </span>
                )}
              </div>

              {/* Twitter Nudity */}
              <div className="flex justify-between items-center">
                <span>Twitter Nudity</span>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Twitter Nudity" ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    >
                      <option value="">Select option...</option>
                      <option value="SFW">SFW</option>
                      <option value="Nipples">Nipples</option>
                      <option value="Full Nude">Full Nude</option>
                      <option value="Sextapes">Sextapes</option>
                    </select>
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
                  <span
                    className={`text-green-600 font-medium ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Twitter Nudity",
                        originalValue:
                          runtimeContext?.contentDetails?.twitterNudity || "",
                        newValue:
                          runtimeContext?.contentDetails?.twitterNudity || "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails?.twitterNudity || "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </span>
                )}
              </div>

              {/* Flyer Censorship Limitations */}
              <div className="flex justify-between items-center">
                <span>Flyer Censorship Limitations</span>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Flyer Censorship Limitations" ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    >
                      <option value="">Select option...</option>
                      <option value="No nudity">No nudity</option>
                      <option value="Shows everything">Shows everything</option>
                      <option value="Topless">Topless</option>
                      <option value="Topless on VIP page">
                        Topless on VIP page
                      </option>
                    </select>
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
                  <span
                    className={`text-rose-600 font-medium ${
                      isAdmin
                        ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Flyer Censorship Limitations",
                        originalValue:
                          runtimeContext?.contentDetails
                            ?.flyerCensorshipLimitations || "",
                        newValue:
                          runtimeContext?.contentDetails
                            ?.flyerCensorshipLimitations || "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails
                      ?.flyerCensorshipLimitations || "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </span>
                )}
              </div>

              {/* Open to Livestreams */}
              <div className="flex justify-between items-center">
                <span>Open to Livestreams</span>
                {isAdmin &&
                editingCell &&
                editingCell.creatorName === (resolvedCreatorName || "") &&
                editingCell.itemName === "Open to Livestreams" ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editingCell.newValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      autoFocus
                    >
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                      <option value="MAYBE">MAYBE</option>
                    </select>
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
                  <Badge
                    variant={
                      runtimeContext?.contentDetails?.openToLivestreams ===
                      "YES"
                        ? "default"
                        : "secondary"
                    }
                    className={`text-xs ${
                      isAdmin ? "cursor-pointer hover:opacity-80" : ""
                    }`}
                    onClick={() =>
                      isAdmin &&
                      setEditingCell({
                        creatorName: resolvedCreatorName || "",
                        itemName: "Open to Livestreams",
                        originalValue:
                          runtimeContext?.contentDetails?.openToLivestreams ||
                          "",
                        newValue:
                          runtimeContext?.contentDetails?.openToLivestreams ||
                          "",
                      })
                    }
                  >
                    {runtimeContext?.contentDetails?.openToLivestreams || "N/A"}
                    {isAdmin && (
                      <Edit2 className="inline ml-1 h-3 w-3 opacity-50" />
                    )}
                  </Badge>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
