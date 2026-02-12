"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  History,
  Edit3,
  Save,
  FileText,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";
import { Task, BoardColumn } from "@/lib/stores/boardStore";
import { Session } from "next-auth";
import WallPostDetailSection from "./WallPostDetailSection";
import TaskComments from "./TaskComments";
import TaskCardHistory from "./TaskCardHistory";
import UserProfile from "@/components/ui/UserProfile";
import UserDropdown from "@/components/UserDropdown";
import { formatForTaskDetail, formatDueDate } from "@/lib/dateUtils";
import {
  extractGoogleDriveFileId,
  isGoogleDriveUrl,
} from "@/lib/utils/googleDriveImageUrl";
import { isS3Url, getProxiedS3Url } from "@/lib/utils/s3ImageUrl";
import { useTeamMembersQuery } from "@/hooks/useBoardQueries";
import PermissionGoogle from "@/components/PermissionGoogle";
import { useVirtualizer } from "@tanstack/react-virtual";

// Wrapper component for Google Drive images that shows permission UI inline
const GoogleDriveImage = ({
  src,
  alt,
  className,
  onError,
  isMainViewer = false,
}: {
  src: string;
  alt: string;
  className: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isMainViewer?: boolean;
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch("/api/google-drive/list");
        if (response.ok) {
          setHasPermission(true);
          setError(false);
        } else {
          setHasPermission(false);
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermission();
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    onError?.(e);
  };

  // For thumbnails, show a simple icon if no permission or image error
  if (!isMainViewer) {
    if (isLoading) {
      return (
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        </div>
      );
    }
    if (error || !hasPermission || imageError) {
      return (
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <div className="text-center">
            <svg
              className="h-5 w-5 text-gray-400 mx-auto mb-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs text-gray-500">
              {imageError ? "No Access" : "GDrive"}
            </span>
          </div>
        </div>
      );
    }
  }

  // Show error state for main viewer if image failed to load
  if (isMainViewer && imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <svg
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <p className="text-gray-400 text-sm">Image not accessible</p>
          <p className="text-gray-500 text-xs mt-1">
            You don't have permission to view this file
          </p>
        </div>
      </div>
    );
  }

  // For main viewer or if permission is granted, show the full PermissionGoogle wrapper
  return (
    <div
      className={
        isMainViewer ? "w-full h-full flex items-center justify-center" : ""
      }
    >
      {hasPermission ? (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={handleImageError}
        />
      ) : (
        <PermissionGoogle apiEndpoint="/api/google-drive/list">
          <img
            src={src}
            alt={alt}
            className={className}
            onError={handleImageError}
          />
        </PermissionGoogle>
      )}
    </div>
  );
};

type TabType = "description" | "photos";

interface WallPostTaskModalProps {
  task: Task;
  isOpen: boolean;
  session: Session | null;
  columns?: BoardColumn[];
  onClose: () => void;
  onRefresh?: () => void;
}

export default function WallPostTaskModal({
  task,
  isOpen,
  session,
  columns = [],
  onClose,
  onRefresh,
}: WallPostTaskModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editedCaption, setEditedCaption] = useState<string>("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [localPhotos, setLocalPhotos] = useState(
    task.wallPostSubmission?.photos || [],
  );

  // Edit mode states
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    task.description || "",
  );
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedAssignee, setEditedAssignee] = useState(task.assignedTo || "");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Initialize photoFilter to READY_TO_POST if there are any photos with that status
  const initialPhotoFilter = React.useMemo(() => {
    const hasReadyToPost = (task.wallPostSubmission?.photos || []).some(
      (p) => p.status === "READY_TO_POST",
    );
    return hasReadyToPost ? "READY_TO_POST" : "ALL";
  }, [task.wallPostSubmission?.photos]);

  const [photoFilter, setPhotoFilter] = useState<
    "ALL" | "PENDING_REVIEW" | "READY_TO_POST" | "POSTED" | "REJECTED"
  >(initialPhotoFilter);

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(
    null,
  );

  // Fetch team members for assignee dropdown
  const membersQuery = useTeamMembersQuery(task.podTeamId || "");
  const teamMembers = membersQuery.data?.members || [];

  // Virtualization setup for photo list
  const photoListRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !task.wallPostSubmission) return null;

  // Filter photos based on selected filter
  const filteredPhotos =
    photoFilter === "ALL"
      ? localPhotos
      : localPhotos.filter((photo) => photo.status === photoFilter);

  const photos = filteredPhotos;
  const selectedPhoto = photos[selectedPhotoIndex];

  // Setup virtualizer for photo thumbnails
  const photoVirtualizer = useVirtualizer({
    count: photos.length,
    getScrollElement: () => photoListRef.current,
    estimateSize: () => 100, // Estimated height of each photo item (thumbnail + padding)
    overscan: 5, // Render 5 extra items above and below viewport for smooth scrolling
  });

  // Get the column label for the current task status
  const getStatusLabel = (status: string) => {
    const column = columns.find((col) => col.status === status);
    return column?.label || status.replace(/_/g, " ");
  };

  // Sync local photos when task changes
  React.useEffect(() => {
    if (task.wallPostSubmission?.photos) {
      setLocalPhotos(task.wallPostSubmission.photos);
      // Auto-select READY_TO_POST filter if there are any ready-to-post photos
      const hasReadyToPost = task.wallPostSubmission.photos.some(
        (p) => p.status === "READY_TO_POST",
      );
      if (hasReadyToPost) {
        setPhotoFilter("READY_TO_POST");
        setSelectedPhotoIndex(0);
      }
    }
  }, [task.wallPostSubmission?.photos]);

  // Initialize caption when photo changes
  React.useEffect(() => {
    if (selectedPhoto) {
      setEditedCaption(selectedPhoto.caption || "");
    }
  }, [selectedPhotoIndex, selectedPhoto?.id]);

  // Auto-scroll to selected photo in virtualized list
  React.useEffect(() => {
    if (selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length) {
      photoVirtualizer.scrollToIndex(selectedPhotoIndex, {
        align: "center",
        behavior: "smooth",
      });
    }
  }, [selectedPhotoIndex, photoVirtualizer, photos.length]);

  // Reset edit states when task changes
  React.useEffect(() => {
    setEditedDescription(task.description || "");
    setEditedPriority(task.priority);
    setEditedAssignee(task.assignedTo || "");
    setIsEditingTask(false);
  }, [task.id, task.description, task.priority, task.assignedTo]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // Download single photo
  const handleDownloadPhoto = async (
    photoUrl: string,
    photoIndex: number,
    photoId?: string,
  ) => {
    const fileName = `${task.title.replace(/[^a-z0-9]/gi, "_")}_photo_${photoIndex + 1}.jpg`;

    // Set downloading state for individual photo
    if (photoId) {
      setDownloadingPhotoId(photoId);
    }

    try {
      // Use authenticated Google Drive API for Google Drive URLs, otherwise use proxy
      let downloadUrl: string;
      if (isGoogleDriveUrl(photoUrl)) {
        const fileId = extractGoogleDriveFileId(photoUrl);
        if (fileId) {
          downloadUrl = `/api/google-drive/thumbnail?fileId=${fileId}&size=2000`;
        } else {
          downloadUrl = `/api/download-photo?url=${encodeURIComponent(photoUrl)}&filename=${encodeURIComponent(fileName)}`;
        }
      } else {
        downloadUrl = `/api/download-photo?url=${encodeURIComponent(photoUrl)}&filename=${encodeURIComponent(fileName)}`;
      }

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

      // Show success toast for individual downloads
      if (photoId && !isDownloading) {
        const { toast } = await import("sonner");
        toast.success("Photo downloaded!", {
          description: fileName,
        });
      }
    } catch (error) {
      console.error("Error downloading photo:", error);

      // Show error toast
      const { toast } = await import("sonner");
      toast.error("Download failed", {
        description: "Opening image in new tab instead",
      });

      // Fallback: Open in new tab
      window.open(photoUrl, "_blank", "noopener,noreferrer");
    } finally {
      if (photoId) {
        setDownloadingPhotoId(null);
      }
    }
  };

  // Load JSZip library dynamically
  const loadJSZip = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if JSZip is already loaded
      if ((window as any).JSZip) {
        resolve((window as any).JSZip);
        return;
      }

      // Load JSZip from CDN
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
      script.onload = () => {
        if ((window as any).JSZip) {
          resolve((window as any).JSZip);
        } else {
          reject(new Error("JSZip failed to load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load JSZip"));
      document.head.appendChild(script);
    });
  };

  // Download all photos as ZIP
  const handleDownloadAllPhotos = async () => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: photos.length });

    const { toast } = await import("sonner");
    const downloadToast = toast.loading(
      `Preparing to download ${photos.length} photos...`,
      {
        description: "Loading ZIP library...",
      },
    );

    try {
      // Load JSZip library
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      toast.loading("Creating ZIP archive...", {
        id: downloadToast,
        description: "Starting compression",
      });

      // Fetch and add each photo to the ZIP
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.url) {
          // Update progress
          setDownloadProgress({ current: i + 1, total: photos.length });

          // Update toast with progress
          const percentage = Math.round(((i + 1) / photos.length) * 100);
          toast.loading(
            `Adding to ZIP: ${i + 1} of ${photos.length} (${percentage}%)`,
            {
              id: downloadToast,
              description: photo.caption
                ? photo.caption.substring(0, 50)
                : `Photo ${i + 1}`,
            },
          );

          try {
            // Use authenticated API for Google Drive URLs, proxy for S3, otherwise use download proxy
            let downloadUrl: string;
            if (isGoogleDriveUrl(photo.url)) {
              const fileId = extractGoogleDriveFileId(photo.url);
              if (fileId) {
                downloadUrl = `/api/google-drive/thumbnail?fileId=${fileId}&size=2000`;
              } else {
                downloadUrl = `/api/download-photo?url=${encodeURIComponent(photo.url)}`;
              }
            } else if (isS3Url(photo.url)) {
              // For S3 URLs, use the proxy to get a fresh presigned URL
              downloadUrl = getProxiedS3Url(photo.url);
            } else {
              downloadUrl = `/api/download-photo?url=${encodeURIComponent(photo.url)}`;
            }

            const response = await fetch(downloadUrl);

            if (!response.ok) {
              console.error(`Failed to fetch photo ${i + 1}`);
              continue;
            }

            // Get the blob and add to ZIP
            const blob = await response.blob();
            const fileName = `photo_${i + 1}_${photo.caption ? photo.caption.substring(0, 30).replace(/[^a-z0-9]/gi, "_") : "image"}.jpg`;
            zip.file(fileName, blob);
          } catch (error) {
            console.error(`Error adding photo ${i + 1} to ZIP:`, error);
            // Continue with other photos
          }
        }
      }

      // Generate the ZIP file
      toast.loading("Generating ZIP file...", {
        id: downloadToast,
        description: "Finalizing download",
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const zipFileName = `${task.title.replace(/[^a-z0-9]/gi, "_")}_photos_${photos.length}.zip`;
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

      toast.success("ZIP file downloaded!", {
        id: downloadToast,
        description: `Successfully compressed ${photos.length} photos into ${zipFileName}`,
      });
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      toast.error("Failed to create ZIP file", {
        id: downloadToast,
        description: "Please try downloading photos individually",
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleStatusChange = async (photoId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state to reflect the change immediately
        setLocalPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo.id === photoId ? { ...photo, status: newStatus } : photo,
          ),
        );
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveCaption = async (photoId: string) => {
    setIsSavingCaption(true);
    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editedCaption }),
      });

      if (response.ok) {
        // Update local state to reflect the change immediately
        setLocalPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo.id === photoId ? { ...photo, caption: editedCaption } : photo,
          ),
        );
        setIsEditingPhotos(false);
        // Refresh task data to ensure persistence
        handleRefresh();
      } else {
        alert("Failed to save caption");
      }
    } catch (error) {
      console.error("Error saving caption:", error);
      alert("Failed to save caption");
    } finally {
      setIsSavingCaption(false);
    }
  };

  const handleSaveTask = async () => {
    setIsSavingTask(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          description: editedDescription,
          priority: editedPriority,
          assignedTo: editedAssignee || null,
        }),
      });

      if (response.ok) {
        setIsEditingTask(false);
        handleRefresh(); // Refresh the task data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[10000]">
      <div className="rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] border overflow-hidden isolate backdrop-blur-none bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {task.title}
                </h3>
                {/* Task ID Badge */}
                {task.podTeam?.projectPrefix && task.taskNumber && (
                  <span className="font-mono bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2.5 py-1 rounded-md text-sm font-semibold border border-pink-200/50 dark:border-pink-700/50 flex-shrink-0">
                    {task.podTeam.projectPrefix}-{task.taskNumber}
                  </span>
                )}
                {task.priority && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      task.priority === "URGENT"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : task.priority === "HIGH"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : task.priority === "MEDIUM"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    <span className="text-xs">
                      {task.priority === "URGENT"
                        ? "🚨"
                        : task.priority === "HIGH"
                          ? "🔴"
                          : task.priority === "MEDIUM"
                            ? "🟡"
                            : "🟢"}
                    </span>
                    <span>{task.priority}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeTab === "description" &&
                (isEditingTask ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingTask(false);
                        setEditedDescription(task.description || "");
                        setEditedPriority(task.priority);
                        setEditedAssignee(task.assignedTo || "");
                      }}
                      disabled={isSavingTask}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveTask}
                      disabled={isSavingTask}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {isSavingTask ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingTask(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                ))}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showHistory
                    ? "text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-200/50 dark:hover:bg-purple-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* History Section (collapsible) */}
        {showHistory && task.podTeamId && (
          <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <TaskCardHistory
              taskId={task.id}
              teamId={task.podTeamId}
              isModal={true}
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("description")}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "description"
                  ? "border-pink-600 text-pink-600 dark:text-pink-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Description</span>
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "photos"
                  ? "border-pink-600 text-pink-600 dark:text-pink-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Photos ({photos.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "description" ? (
            // Description Tab - Keep original sidebar layout
            <div className="flex flex-col lg:flex-row h-full">
              {/* Main Content Area */}
              <div className="flex-1 p-4 sm:p-6 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] overflow-y-auto">
                <div className="space-y-6">
                  {/* Photo Status Summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      Photo Status Overview
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const statusCounts = {
                          PENDING_REVIEW: {
                            count: 0,
                            label: "Pending Review",
                            color:
                              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
                            dotColor: "bg-gray-500",
                          },
                          READY_TO_POST: {
                            count: 0,
                            label: "Ready to Post",
                            color:
                              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            dotColor: "bg-blue-500",
                          },
                          POSTED: {
                            count: 0,
                            label: "Posted",
                            color:
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            dotColor: "bg-green-500",
                          },
                          REJECTED: {
                            count: 0,
                            label: "Rejected",
                            color:
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            dotColor: "bg-red-500",
                          },
                        };

                        photos.forEach((photo) => {
                          if (
                            statusCounts[
                              photo.status as keyof typeof statusCounts
                            ]
                          ) {
                            statusCounts[
                              photo.status as keyof typeof statusCounts
                            ].count++;
                          }
                        });

                        return Object.entries(statusCounts).map(
                          ([status, data]) => (
                            <div
                              key={status}
                              className={`p-4 rounded-lg border ${data.color.includes("gray") ? "border-gray-200 dark:border-gray-700" : data.color.includes("blue") ? "border-blue-200 dark:border-blue-800" : data.color.includes("green") ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${data.dotColor}`}
                                ></div>
                                <span className="text-2xl font-bold">
                                  {data.count}
                                </span>
                              </div>
                              <p className="text-xs font-medium opacity-80">
                                {data.label}
                              </p>
                              {photos.length > 0 && (
                                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${data.dotColor}`}
                                    style={{
                                      width: `${(data.count / photos.length) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          ),
                        );
                      })()}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      Description
                    </h4>
                    {isEditingTask ? (
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none min-h-[150px]"
                        placeholder="Enter task description..."
                      />
                    ) : task.description ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                          {task.description
                            .split(/(\bhttps?:\/\/[^\s]+)/g)
                            .map((part, index) => {
                              if (part.match(/^https?:\/\//)) {
                                return (
                                  <a
                                    key={index}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
                                  >
                                    {part}
                                  </a>
                                );
                              }
                              return part;
                            })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No description provided
                      </p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="min-w-0">
                    <TaskComments
                      taskId={task.id}
                      teamId={task.podTeamId || undefined}
                      currentUser={
                        session?.user
                          ? {
                              id: session.user.id!,
                              name: session.user.name,
                              email: session.user.email!,
                              image: session.user.image,
                            }
                          : null
                      }
                      isViewOnly={false}
                      photoId={undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-80 lg:max-w-80 lg:flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                <div className="space-y-4 min-w-0">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg min-w-0">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Priority
                    </label>
                    {isEditingTask ? (
                      <select
                        value={editedPriority}
                        onChange={(e) =>
                          setEditedPriority(e.target.value as any)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      >
                        <option value="LOW">🟢 LOW</option>
                        <option value="MEDIUM">🟡 MEDIUM</option>
                        <option value="HIGH">🔴 HIGH</option>
                        <option value="URGENT">🚨 URGENT</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-sm flex-shrink-0">
                          {task.priority === "URGENT"
                            ? "🚨"
                            : task.priority === "HIGH"
                              ? "🔴"
                              : task.priority === "MEDIUM"
                                ? "🟡"
                                : "🟢"}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {task.priority}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Assignee
                    </label>
                    <UserDropdown
                      value={editedAssignee}
                      onChange={async (userId, email) => {
                        setEditedAssignee(email);
                        // Auto-save assignee change
                        try {
                          const response = await fetch("/api/tasks", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: task.id,
                              assignedTo: email || null,
                            }),
                          });

                          if (response.ok) {
                            handleRefresh(); // Refresh the task data
                          } else {
                            const data = await response.json();
                            alert(data.error || "Failed to update assignee");
                            setEditedAssignee(task.assignedTo || ""); // Revert on error
                          }
                        } catch (error) {
                          console.error("Error updating assignee:", error);
                          alert("Failed to update assignee");
                          setEditedAssignee(task.assignedTo || ""); // Revert on error
                        }
                      }}
                      placeholder="Select assignee..."
                      teamId={task.podTeamId || undefined}
                    />
                  </div>

                  {/* Due Date */}
                  {task.dueDate && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Due Date
                      </label>
                      <div className="flex items-center space-x-2 min-w-0">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span
                          className={`text-sm truncate ${formatDueDate(task.dueDate).className}`}
                        >
                          {formatDueDate(task.dueDate).formatted}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Created */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Created
                    </label>
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {formatForTaskDetail(task.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 min-w-0">
                        <UserProfile
                          user={task.createdBy}
                          size="sm"
                          showTooltip
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {task.createdBy.name ||
                              task.createdBy.email
                                ?.split("@")[0]
                                .replace(/[._-]/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Last Updated
                    </label>
                    <div className="flex items-center space-x-2 min-w-0">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {formatForTaskDetail(task.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Photos Tab - YouTube-style layout
            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Section - Photo Viewer and Comments */}
              <div className="flex-1 flex flex-col">
                {/* Main Photo Viewer */}
                <div
                  className="bg-black flex items-center justify-center p-4 sm:p-8 relative"
                  style={{ height: "60%" }}
                >
                  {/* External Link Button - Upper Right */}
                  {selectedPhoto && selectedPhoto.url && (
                    <a
                      href={(() => {
                        if (isGoogleDriveUrl(selectedPhoto.url!)) {
                          const fileId = extractGoogleDriveFileId(
                            selectedPhoto.url!,
                          );
                          return fileId
                            ? `https://drive.google.com/file/d/${fileId}/view`
                            : selectedPhoto.url!;
                        }
                        // For S3 URLs, use proxied URL to get fresh presigned URL
                        if (isS3Url(selectedPhoto.url!)) {
                          return getProxiedS3Url(selectedPhoto.url!);
                        }
                        // For other URLs, open directly.
                        return selectedPhoto.url!;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 z-10 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all hover:scale-110 backdrop-blur-sm border border-white/20"
                      title={
                        isGoogleDriveUrl(selectedPhoto.url)
                          ? "Open in Google Drive"
                          : isS3Url(selectedPhoto.url)
                            ? "Open image"
                            : "Open in new tab"
                      }
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}

                  {selectedPhoto && selectedPhoto.url ? (
                    <>
                      {/* Handle Google Drive images with permission UI */}
                      {isGoogleDriveUrl(selectedPhoto.url) ? (
                        <GoogleDriveImage
                          src={(() => {
                            const fileId = extractGoogleDriveFileId(
                              selectedPhoto.url,
                            );
                            return fileId
                              ? `/api/google-drive/thumbnail?fileId=${fileId}&size=2000`
                              : selectedPhoto.url;
                          })()}
                          alt={`Photo ${selectedPhotoIndex + 1}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error(
                              "Failed to load image:",
                              selectedPhoto.url,
                            );
                            e.currentTarget.style.display = "none";
                          }}
                          isMainViewer={true}
                        />
                      ) : (
                        /* Handle S3 and other URLs - proxy S3 URLs to handle expiration */
                        <img
                          src={
                            isS3Url(selectedPhoto.url)
                              ? getProxiedS3Url(selectedPhoto.url)
                              : selectedPhoto.url
                          }
                          alt={`Photo ${selectedPhotoIndex + 1}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error(
                              "Failed to load image:",
                              selectedPhoto.url,
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400 text-center">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No photo selected</p>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div
                  className="border-t border-gray-200 dark:border-gray-700 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] overflow-y-auto"
                  style={{ height: "40%" }}
                >
                  <div className="p-4">
                    <TaskComments
                      taskId={task.id}
                      teamId={task.podTeamId || undefined}
                      currentUser={
                        session?.user
                          ? {
                              id: session.user.id!,
                              name: session.user.name,
                              email: session.user.email!,
                              image: session.user.image,
                            }
                          : null
                      }
                      isViewOnly={false}
                      photoId={selectedPhoto?.id}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Photo List (YouTube-style) s*/}
              <div className="w-full lg:w-96 lg:flex-shrink-0 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Photo Details Section */}
                {selectedPhoto && (
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="space-y-2">
                      {/* Photo Number and Status */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Photo {selectedPhotoIndex + 1} of {photos.length}
                        </h3>
                        <div className="relative">
                          <select
                            value={selectedPhoto.status}
                            onChange={(e) =>
                              handleStatusChange(
                                selectedPhoto.id,
                                e.target.value,
                              )
                            }
                            disabled={isUpdatingStatus}
                            className={`text-xs px-2 py-1 rounded-full border bg-white dark:bg-gray-800 ${
                              isUpdatingStatus
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <option value="PENDING_REVIEW">
                              Pending Review
                            </option>
                            <option value="READY_TO_POST">Ready to Post</option>
                            <option value="POSTED">Posted</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          {isUpdatingStatus && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-pink-500 border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caption Editor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Caption
                          </label>
                          <button
                            onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={
                              isEditingPhotos ? "Done editing" : "Edit caption"
                            }
                          >
                            {isEditingPhotos ? (
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Edit3 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                        {isEditingPhotos ? (
                          <>
                            <textarea
                              value={editedCaption}
                              onChange={(e) => setEditedCaption(e.target.value)}
                              placeholder="Enter caption..."
                              rows={4}
                              disabled={isSavingCaption}
                              className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none ${
                                isSavingCaption
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                            {editedCaption !==
                              (selectedPhoto.caption || "") && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    handleSaveCaption(selectedPhoto.id)
                                  }
                                  disabled={isSavingCaption}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSavingCaption ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-3 w-3" />
                                      <span>Save</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    setEditedCaption(
                                      selectedPhoto.caption || "",
                                    )
                                  }
                                  disabled={isSavingCaption}
                                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </>
                        ) : selectedPhoto.caption ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-1">
                            {selectedPhoto.caption}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                            No caption
                          </p>
                        )}
                      </div>

                      {/* Photo Metadata */}
                      {selectedPhoto.postedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          <Check className="h-3 w-3 inline mr-1" />
                          Posted:{" "}
                          {new Date(selectedPhoto.postedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Filter Buttons and Download All */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setPhotoFilter("ALL");
                          setSelectedPhotoIndex(0);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          photoFilter === "ALL"
                            ? "bg-pink-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        All ({localPhotos.length})
                      </button>
                      <button
                        onClick={() => {
                          setPhotoFilter("PENDING_REVIEW");
                          setSelectedPhotoIndex(0);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          photoFilter === "PENDING_REVIEW"
                            ? "bg-gray-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        Pending (
                        {
                          localPhotos.filter(
                            (p) => p.status === "PENDING_REVIEW",
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => {
                          setPhotoFilter("READY_TO_POST");
                          setSelectedPhotoIndex(0);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          photoFilter === "READY_TO_POST"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        Ready (
                        {
                          localPhotos.filter(
                            (p) => p.status === "READY_TO_POST",
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => {
                          setPhotoFilter("POSTED");
                          setSelectedPhotoIndex(0);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          photoFilter === "POSTED"
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        Posted (
                        {
                          localPhotos.filter((p) => p.status === "POSTED")
                            .length
                        }
                        )
                      </button>
                      <button
                        onClick={() => {
                          setPhotoFilter("REJECTED");
                          setSelectedPhotoIndex(0);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          photoFilter === "REJECTED"
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        Rejected (
                        {
                          localPhotos.filter((p) => p.status === "REJECTED")
                            .length
                        }
                        )
                      </button>
                    </div>

                    {/* Download All Icon - Subtle */}
                    {photos.length > 0 && (
                      <button
                        onClick={handleDownloadAllPhotos}
                        disabled={isDownloading}
                        className={`relative p-2 rounded-lg transition-colors ${
                          isDownloading
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-wait"
                            : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        }`}
                        title={
                          isDownloading
                            ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...`
                            : `Download all ${photos.length} photos`
                        }
                      >
                        {isDownloading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                        {/* Progress indicator */}
                        {isDownloading && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {downloadProgress.current}
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Download Progress Bar */}
                {isDownloading && (
                  <div className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Downloading photos...
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {downloadProgress.current} / {downloadProgress.total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 ease-out"
                        style={{
                          width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Photo Thumbnails List - Virtualized */}
                <div ref={photoListRef} className="flex-1 overflow-y-auto">
                  <div
                    style={{
                      height: `${photoVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                    className="p-2"
                  >
                    {photos.length > 0 ? (
                      photoVirtualizer.getVirtualItems().map((virtualItem) => {
                        const photo = photos[virtualItem.index];
                        const index = virtualItem.index;
                        return (
                          <div
                            key={photo.id}
                            data-index={virtualItem.index}
                            ref={photoVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className="px-2 pb-2"
                          >
                            <div
                              className={`w-full flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                                selectedPhotoIndex === index
                                  ? "bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-500"
                                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {/* Thumbnail with Download Icon */}
                              <div className="flex-shrink-0 relative group">
                                <button
                                  onClick={() => setSelectedPhotoIndex(index)}
                                  className="block"
                                >
                                  {photo.url ? (
                                    // Handle Google Drive thumbnails with permission UI
                                    isGoogleDriveUrl(photo.url) ? (
                                      <GoogleDriveImage
                                        src={(() => {
                                          const fileId =
                                            extractGoogleDriveFileId(photo.url);
                                          return fileId
                                            ? `/api/google-drive/thumbnail?fileId=${fileId}&size=2000`
                                            : photo.url;
                                        })()}
                                        alt={`Photo ${index + 1}`}
                                        className="w-20 h-20 object-contain rounded bg-gray-900"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    ) : (
                                      // Handle S3 and other URLs - proxy S3 URLs to handle expiration
                                      <img
                                        src={
                                          isS3Url(photo.url)
                                            ? getProxiedS3Url(photo.url)
                                            : photo.url
                                        }
                                        alt={`Photo ${index + 1}`}
                                        className="w-20 h-20 object-contain rounded bg-gray-900"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    )
                                  ) : (
                                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </button>

                                {/* Download Icon - Shows on hover or when downloading */}
                                {photo.url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPhoto(
                                        photo.url!,
                                        index,
                                        photo.id,
                                      );
                                    }}
                                    disabled={downloadingPhotoId === photo.id}
                                    className={`absolute top-1 right-1 p-1.5 rounded-md transition-opacity ${
                                      downloadingPhotoId === photo.id
                                        ? "bg-blue-600 text-white opacity-100"
                                        : "bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100"
                                    }`}
                                    title={
                                      downloadingPhotoId === photo.id
                                        ? "Downloading..."
                                        : "Download photo"
                                    }
                                  >
                                    <Download
                                      className={`h-3.5 w-3.5 ${downloadingPhotoId === photo.id ? "animate-bounce" : ""}`}
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Info */}
                              <button
                                onClick={() => setSelectedPhotoIndex(index)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Photo {index + 1}
                                  </span>
                                  {selectedPhotoIndex === index && (
                                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 max-h-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-1">
                                  {photo.caption || "No caption"}
                                </div>
                                <div className="mt-1">
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                      photo.status === "POSTED"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : photo.status === "READY_TO_POST"
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                          : photo.status === "REJECTED"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {photo.status.replace("_", " ")}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          No photos found
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {photoFilter === "ALL"
                            ? "No photos available"
                            : `No photos with status: ${photoFilter.replace("_", " ").toLowerCase()}`}
                        </p>
                        <button
                          onClick={() => {
                            setPhotoFilter("ALL");
                            setSelectedPhotoIndex(0);
                          }}
                          className="mt-4 px-4 py-2 text-xs font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                        >
                          Show all photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
