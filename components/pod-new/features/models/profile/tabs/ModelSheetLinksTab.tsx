"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  ExternalLink,
  Folder,
  Calendar,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SheetGenerationWizard } from "./SheetGenerationWizard";
import { Dialog } from "@/components/ui/dialog";

interface SheetLink {
  id: string;
  sheetUrl: string;
  sheetName: string | null;
  sheetType: string | null;
  folderName: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ModelSheetLinksTabProps {
  modelName: string;
}

export function ModelSheetLinksTab({ modelName }: ModelSheetLinksTabProps) {
  // Filter and sort state
  const [filterType, setFilterType] = useState<string>("");
  const [filterFolder, setFilterFolder] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch sheet links and launchesPodFolderId for the model
  const {
    data: sheetLinksData,
    isLoading: sheetLinksLoading,
    error: sheetLinksError,
  } = useQuery<{ sheetLinks: SheetLink[]; launchesPodFolderId?: string }>({
    queryKey: ["model-sheet-links", modelName],
    queryFn: async () => {
      const response = await fetch(
        `/api/models/${encodeURIComponent(modelName)}/sheet-links`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sheet links");
      }
      return response.json();
    },
    enabled: !!modelName,
    select: (data) => {
      // If API returns array, treat as legacy, else expect launchesPodFolderId
      if (Array.isArray(data)) return { sheetLinks: data };
      return data;
    },
  });

  // Filtered and sorted sheetLinks (guard against undefined)
  const filteredLinks = Array.isArray(sheetLinksData?.sheetLinks)
    ? sheetLinksData.sheetLinks
        .filter(
          (link) =>
            (!filterType ||
              (link.sheetType &&
                link.sheetType.toLowerCase() === filterType)) &&
            (!filterFolder ||
              (link.folderName &&
                link.folderName.toLowerCase() === filterFolder))
        )
        .sort((a, b) => {
          if (sortBy === "name") {
            const nameA = (a.sheetName || "").toLowerCase();
            const nameB = (b.sheetName || "").toLowerCase();
            if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
            if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
            return 0;
          } else {
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
          }
        })
    : [];
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  // State for group selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && sheetLinksData?.sheetLinks) {
      setSelectedIds(sheetLinksData.sheetLinks.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleGroupDelete = async () => {
    if (
      !isAdmin ||
      selectedIds.length === 0 ||
      deleteConfirmText !== "confirm delete"
    )
      return;
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const response = await fetch(
            `/api/models/${encodeURIComponent(modelName)}/sheet-links/${id}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) throw new Error("Failed to delete sheet link");
        })
      );
      toast.success("Selected sheet links deleted successfully");
      setSelectedIds([]);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      queryClient.invalidateQueries({
        queryKey: ["model-sheet-links", modelName],
      });
    } catch (error) {
      toast.error("Failed to delete selected sheet links");
    }
  };

  // Remove duplicate useQuery for sheetLinks

  const getSheetTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "pricing":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "content":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "analytics":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "schedule":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(
        `/api/models/${encodeURIComponent(modelName)}/sheet-links/${linkId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete sheet link");
      }

      toast.success("Sheet link deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["model-sheet-links", modelName],
      });
    } catch (error) {
      console.error("Error deleting sheet link:", error);
      toast.error("Failed to delete sheet link");
    }
  };

  if (sheetLinksLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Skeleton className="h-4 w-20" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {[...Array(6)].map((_, i) => (
                <tr
                  key={i}
                  className="hover:bg-pink-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3.5 h-3.5" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sheetLinksError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load sheet links
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {sheetLinksError instanceof Error
            ? sheetLinksError.message
            : "Unable to fetch sheet links"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sheet Links
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sheetLinksData?.sheetLinks?.length || 0}{" "}
            {sheetLinksData?.sheetLinks?.length === 1 ? "sheet" : "sheets"}{" "}
            linked to {modelName}
          </p>
          {/* External link to Launches POD parent folder */}
          {sheetLinksData?.launchesPodFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${sheetLinksData.launchesPodFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-3 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-pink-100 dark:hover:bg-pink-900 transition"
            >
              <Folder className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              View Launches POD Folder
            </a>
          )}
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Sheets
          </Button>
        )}
      </div>

      {/* Sheet Generation Wizard */}
      <SheetGenerationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        modelName={modelName}
      />

      {/* Filter and Sort Controls */}
      {sheetLinksData?.sheetLinks && sheetLinksData.sheetLinks.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-4 items-center mb-4 justify-between">
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Filter by Type:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="analyst sheet">Analyst Sheet</option>
                  <option value="creator sheet">Creator Sheet</option>
                  <option value="scheduler sheet">Scheduler Sheet</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Filter by Folder:
                </label>
                <select
                  value={filterFolder}
                  onChange={(e) => setFilterFolder(e.target.value)}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  {/* Dynamically list unique folder names */}
                  {Array.isArray(sheetLinksData?.sheetLinks) &&
                    Array.from(
                      new Set(
                        sheetLinksData.sheetLinks
                          .map((l: SheetLink) => l.folderName)
                          .filter((f): f is string => !!f)
                      )
                    ).map((folder) => (
                      <option key={folder} value={folder.toLowerCase()}>
                        {folder}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("");
                    setFilterFolder("");
                  }}
                  className="px-3 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-pink-100 dark:hover:bg-pink-900 transition"
                >
                  Clear Filters
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "updatedAt")
                  }
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100 mr-2"
                >
                  <option value="name">Name</option>
                  <option value="updatedAt">Updated</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
            {isAdmin && selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={
                        sheetLinksData?.sheetLinks?.length > 0 &&
                        selectedIds.length === sheetLinksData.sheetLinks.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Folder
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Updated
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-pink-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(link.id)}
                        onChange={(e) =>
                          handleSelect(link.id, e.target.checked)
                        }
                        aria-label={`Select ${link.sheetName || "Untitled Sheet"}`}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        <span
                          className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                          title={link.sheetName || "Untitled Sheet"}
                        >
                          {link.sheetName || "Untitled Sheet"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {link.sheetType && (
                        <Badge
                          className={`${getSheetTypeColor(link.sheetType)} w-fit`}
                          variant="secondary"
                        >
                          {link.sheetType}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {link.folderName && (
                          <>
                            <Folder className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {link.folderName}
                            </span>
                            {link.folderId && (
                              <a
                                href={`https://drive.google.com/drive/folders/${link.folderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Updated {formatDate(link.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={link.sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            className="group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white group-hover:border-transparent transition-all"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </a>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowDeleteModal(true);
                              setPendingDeleteId(link.id);
                            }}
                            className="p-1"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isAdmin && selectedIds.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white dark:!bg-[oklch(0.205_0_0)] rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-pink-900">
                <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
                  Confirm Delete
                </h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  {pendingDeleteId
                    ? <>Are you sure you want to delete <span className="font-bold">1</span> sheet link? This action cannot be undone.</>
                    : <>Are you sure you want to delete <span className="font-bold">{selectedIds.length}</span> sheet link(s)? This action cannot be undone.</>
                  }
                </p>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Type <span className="font-mono font-bold text-pink-600">confirm delete</span> to proceed.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Type 'confirm delete'"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText("");
                      setPendingDeleteId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  {pendingDeleteId ? (
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={deleteConfirmText !== "confirm delete" || isDeleting}
                      onClick={async () => {
                        if (!isAdmin || !pendingDeleteId || deleteConfirmText !== "confirm delete") return;
                        setIsDeleting(true);
                        try {
                          const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links/${pendingDeleteId}`, {
                            method: "DELETE",
                          });
                          if (!response.ok) throw new Error("Failed to delete sheet link");
                          toast.success("Sheet link deleted successfully");
                          setPendingDeleteId(null);
                          setShowDeleteModal(false);
                          setDeleteConfirmText("");
                          queryClient.invalidateQueries({ queryKey: ["model-sheet-links", modelName] });
                        } catch (error) {
                          toast.error("Failed to delete sheet link");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={deleteConfirmText !== "confirm delete" || isDeleting}
                      onClick={async () => {
                        if (!isAdmin || selectedIds.length === 0 || deleteConfirmText !== "confirm delete") return;
                        setIsDeleting(true);
                        try {
                          await Promise.all(
                            selectedIds.map(async (id) => {
                              const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links/${id}`, {
                                method: "DELETE",
                              });
                              if (!response.ok) throw new Error("Failed to delete sheet link");
                            })
                          );
                          toast.success("Selected sheet links deleted successfully");
                          setSelectedIds([]);
                          setShowDeleteModal(false);
                          setDeleteConfirmText("");
                          queryClient.invalidateQueries({ queryKey: ["model-sheet-links", modelName] });
                        } catch (error) {
                          toast.error("Failed to delete selected sheet links");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No sheet links found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
            There are no sheets linked to this model yet.
          </p>
          {isAdmin && (
            <Button
              onClick={() => setIsWizardOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Your First Sheet
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
