"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { X, Edit2, Save, Trash2, RotateCcw } from "lucide-react";
import EventForm, { uploadLocalFilesToS3, LocalFile } from "./EventForm";
import { contentEventValidation } from "@/schema/zodValidationSchema";

interface EventDetailModalProps {
  event: ContentEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (eventId: string, eventData: Partial<ContentEvent>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onRestore?: (eventId: string) => Promise<void>;
  onPermanentDelete?: (eventId: string) => Promise<void>;
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onRestore,
  onPermanentDelete
}: EventDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      // Format date for input
      const year = event.date.getFullYear();
      const month = String(event.date.getMonth() + 1).padStart(2, '0');
      const day = String(event.date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: localDateString,
        time: event.time || "",
        type: event.type || "",
        creator: event.creator || "",
        tags: event.tags?.join(', ') || "",
        price: event.price?.toString() || "",
        color: event.color || "pink",
        notes: event.notes || "",
        attachments: event.attachments || [],
        contentLink: event.contentLink || "",
        editedVideoLink: event.editedVideoLink || "",
        flyerLink: event.flyerLink || "",
        liveType: event.liveType || "",
      });
    }
  }, [event]);

  // Reset edit mode and local files when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setLocalFiles([]);
      setErrors({});
    }
  }, [isOpen]);

  // Clear errors when fields are updated
  useEffect(() => {
    if (!formData) return;

    const newErrors = { ...errors };

    if (formData.date && errors.date) {
      delete newErrors.date;
    }
    if (formData.type && errors.type) {
      delete newErrors.type;
    }
    if (formData.creator && errors.creator) {
      delete newErrors.creator;
    }

    if (Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors);
    }
  }, [formData?.date, formData?.type, formData?.creator]);

  if (!isOpen || !event || !formData) return null;

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData((prev: any) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newFiles]
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleUpdate = async () => {
    if (!onUpdate || isUpdating) return;

    // Validate form data
    const validation = contentEventValidation.safeParse({
      date: formData.date,
      type: formData.type,
      creator: formData.creator,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});
    setIsUpdating(true);

    try {
      // Upload local files to S3 first
      let uploadedAttachments = [...(formData.attachments || [])];
      if (localFiles.length > 0) {
        const newAttachments = await uploadLocalFilesToS3(localFiles);
        uploadedAttachments = [...uploadedAttachments, ...newAttachments];
      }

      const eventData: Partial<ContentEvent> = {
        date: new Date(formData.date),
        time: formData.time || undefined,
        type: formData.type,
        creator: formData.creator || undefined,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        color: formData.color,
        contentLink: formData.contentLink || undefined,
        editedVideoLink: formData.editedVideoLink || undefined,
        flyerLink: formData.flyerLink || undefined,
        liveType: formData.liveType || undefined,
        notes: formData.notes || undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      await onUpdate(event.id, eventData);
      setIsEditMode(false);
      setLocalFiles([]); // Clear local files after successful update
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setErrors({});
    setLocalFiles([]); // Clear local files on cancel
    // Reset form data to original event data
    if (event) {
      const year = event.date.getFullYear();
      const month = String(event.date.getMonth() + 1).padStart(2, '0');
      const day = String(event.date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: localDateString,
        time: event.time || "",
        type: event.type || "",
        creator: event.creator || "",
        tags: event.tags?.join(', ') || "",
        price: event.price?.toString() || "",
        color: event.color || "pink",
        notes: event.notes || "",
        attachments: event.attachments || [],
        contentLink: event.contentLink || "",
        editedVideoLink: event.editedVideoLink || "",
        flyerLink: event.flyerLink || "",
        liveType: event.liveType || "",
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting || !event) return;

    if (!confirm("Are you sure you want to delete this event? It can be restored later.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(event.id);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore || isRestoring || !event) return;

    setIsRestoring(true);
    try {
      await onRestore(event.id);
    } catch (error) {
      console.error("Error restoring event:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!onPermanentDelete || isPermanentDeleting || !event) return;

    if (!confirm("⚠️ PERMANENT DELETE\n\nThis will PERMANENTLY delete this event from the database. This action CANNOT be undone.\n\nAre you absolutely sure you want to continue?")) {
      return;
    }

    setIsPermanentDeleting(true);
    try {
      await onPermanentDelete(event.id);
    } catch (error) {
      console.error("Error permanently deleting event:", error);
    } finally {
      setIsPermanentDeleting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                {isEditMode ? "Edit Event" : "Event Details"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Delete button in header - only show for active events in view mode */}
                {!isEditMode && !event.deletedAt && onDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Delete event"
                  >
                    {isDeleting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-red-600 border-r-transparent"></div>
                    ) : (
                      <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-600 dark:text-gray-500 dark:group-hover:text-red-400 transition-colors" />
                    )}
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            {/* Deleted Banner */}
            {event.deletedAt && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                      This event has been deleted
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {onPermanentDelete && (
                      <button
                        onClick={handlePermanentDelete}
                        disabled={isPermanentDeleting || isRestoring}
                        className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed underline"
                        title="Permanently delete this event from database"
                      >
                        {isPermanentDeleting ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-red-600 border-r-transparent"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <span>Delete Forever</span>
                        )}
                      </button>
                    )}
                    <span className="text-xs text-red-600 dark:text-red-400 whitespace-nowrap">
                      {new Date(event.deletedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <EventForm
              mode={isEditMode ? "edit" : "view"}
              formData={isEditMode ? formData : event}
              setFormData={isEditMode ? setFormData : undefined}
              isDragging={isDragging}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              disabled={isUpdating}
              errors={errors}
              localFiles={localFiles}
              setLocalFiles={setLocalFiles}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {event.deletedAt ? (
                  // Deleted event - show restore button and close
                  <>
                    {onRestore && (
                      <button
                        onClick={handleRestore}
                        disabled={isRestoring || isPermanentDeleting}
                        className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isRestoring ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Restore Event
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      disabled={isRestoring || isPermanentDeleting}
                      className="flex-1 px-6 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  // Active event - show edit and delete buttons
                  <>
                    {onUpdate && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="flex-1 px-6 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                   
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Close
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
