"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, DollarSign, Tag, FileText, Upload } from "lucide-react";
import { ContentEvent, EventType, EventStatus } from "@/app/(root)/(pod)/content-dates/page";
import MarkdownEditor from "./MarkdownEditor";
import ModelsDropdownList from "@/components/ModelsDropdownList";
import EventForm, { uploadLocalFilesToS3, LocalFile } from "./EventForm";
import { contentEventValidation } from "@/schema/zodValidationSchema";
import { z } from "zod";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<ContentEvent>) => void;
  prefilledDate?: Date | null;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledDate,
}: CreateEventModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "" as EventType | "",
    creator: "",
    tags: "",
    price: "",
    color: "pink" as ContentEvent["color"],
    notes: "",
    attachments: [] as any[], // Changed from File[] to support TaskAttachment objects
    contentLink: "",
    editedVideoLink: "",
    flyerLink: "",
    liveType: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [confirmQueued, setConfirmQueued] = useState(false);

  useEffect(() => {
    if (prefilledDate) {
      // Format date in local timezone to avoid timezone shift
      const year = prefilledDate.getFullYear();
      const month = String(prefilledDate.getMonth() + 1).padStart(2, '0');
      const day = String(prefilledDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      setFormData(prev => ({
        ...prev,
        date: localDateString,
      }));
    }
  }, [prefilledDate]);

  // Clear errors when fields are updated
  useEffect(() => {
    const newErrors = { ...errors };

    // Clear date error if date is filled
    if (formData.date && errors.date) {
      delete newErrors.date;
    }

    // Clear type error if type is filled
    if (formData.type && errors.type) {
      delete newErrors.type;
    }

    // Clear creator error if creator is filled
    if (formData.creator && errors.creator) {
      delete newErrors.creator;
    }

    // Only update if errors changed
    if (Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors);
    }
  }, [formData.date, formData.type, formData.creator]);

  // Clear confirmQueued error when checkbox toggled on
  useEffect(() => {
    if (confirmQueued && errors.confirmQueued) {
      const copy = { ...errors };
      delete copy.confirmQueued;
      setErrors(copy);
    }
  }, [confirmQueued]);

  // If there are no image attachments (uploaded or local), reset confirmQueued to false
  useEffect(() => {
    const hasImage = (formData.attachments || []).some((a: any) => a?.type?.startsWith?.('image/')) || localFiles.some((lf) => lf.file.type?.startsWith?.('image/'));
    if (!hasImage && confirmQueued) setConfirmQueued(false);
  }, [formData.attachments, localFiles]);

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreating) return; // Prevent double submission

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

    // If there are image attachments (uploaded or local), require confirmQueued
    const previewHasImage = (formData.attachments || []).some((a: any) => a?.type?.startsWith?.('image/')) || localFiles.some((lf) => lf.file.type?.startsWith?.('image/'));
    if (previewHasImage && !confirmQueued) {
      setErrors((prev) => ({ ...prev, confirmQueued: 'Please confirm the event is in the queue since a screenshot is attached.' }));
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    setIsCreating(true);

    try {
      // Upload local files to S3 first
      let uploadedAttachments = [...(formData.attachments || [])];
      if (localFiles.length > 0) {
        const newAttachments = await uploadLocalFilesToS3(localFiles);
        uploadedAttachments = [...uploadedAttachments, ...newAttachments];
      }

      // Generate title from creator and type
      const generatedTitle = formData.creator
        ? `${formData.creator} - ${formData.type}`
        : formData.type;

    const hasImageAttachment = uploadedAttachments.some((a: any) => a?.type?.startsWith?.('image/'));

    const eventData: Partial<ContentEvent> = {
        title: generatedTitle,
        date: new Date(formData.date),
        time: formData.time || undefined,
        type: formData.type ? (formData.type as EventType) : undefined,
        creator: formData.creator || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
  // If confirmed queued and there is an image, force green; if no images, force pink. Otherwise keep chosen color.
  color: (confirmQueued && hasImageAttachment) ? 'green' as ContentEvent["color"] : (!hasImageAttachment ? 'pink' as ContentEvent["color"] : formData.color),
        contentLink: formData.contentLink || undefined,
        editedVideoLink: formData.editedVideoLink || undefined,
        flyerLink: formData.flyerLink || undefined,
        liveType: (formData.liveType as any) || undefined,
        notes: formData.notes || undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      // If user confirmed queued and there is at least one image attachment, mark as IN_QUEUE
      status: (confirmQueued && uploadedAttachments.some((a: any) => a?.type?.startsWith?.('image/'))) ? ("IN_QUEUE" as EventStatus) : ("PROCESSING" as EventStatus),
      };

      await onSubmit(eventData);

      // Reset form only after successful submission
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "",
        creator: "",
        tags: "",
        price: "",
        color: "pink",
        notes: "",
        attachments: [],
        contentLink: "",
        editedVideoLink: "",
        flyerLink: "",
        liveType: "",
      });
      setLocalFiles([]);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
              Create New Event
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Form - delegate to EventView but keep same structure */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <EventForm
                mode="edit"
                formData={formData}
                setFormData={(d) => setFormData(d)}
                isDragging={isDragging}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleFileChange={handleFileChange}
                disabled={isCreating}
                errors={errors}
                localFiles={localFiles}
                setLocalFiles={setLocalFiles}
              />
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              {/* Show confirm checkbox when there are image attachments (uploaded or local) */}
              {((formData.attachments && formData.attachments.some((a: any) => a?.type?.startsWith?.('image/'))) || localFiles.length > 0) && (
                <div className="flex items-start gap-3 mb-3">
                  <input
                    id="confirm-queued"
                    type="checkbox"
                    checked={confirmQueued}
                    onChange={(e) => setConfirmQueued(e.target.checked)}
                    disabled={isCreating}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <div className="text-sm">
                    <label htmlFor="confirm-queued" className="font-medium text-gray-700 dark:text-gray-200">
                      Confirm event in queue?
                    </label>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                      I confirm this screenshot shows the event in the platform queue; when confirmed the event will be marked In queue (green). Default state is Processing.
                    </div>
                    {errors.confirmQueued && (
                      <div className="text-xs text-red-500 mt-1">{errors.confirmQueued}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-6 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
