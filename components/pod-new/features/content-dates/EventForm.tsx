"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownViewer from "./MarkdownViewer";
import ModelsDropdownList from "@/components/ModelsDropdownList";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";

interface TaskAttachment {
  id: string;
  name: string;
  s3Key: string;
  url?: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface LocalFile {
  file: File;
  preview?: string; // For image previews
}

interface EventFormProps {
  mode: "edit" | "view";
  formData?: any;
  setFormData?: (data: any) => void;
  isDragging?: boolean;
  handleDragOver?: (e: React.DragEvent) => void;
  handleDragLeave?: (e: React.DragEvent) => void;
  handleDrop?: (e: React.DragEvent) => void;
  handleFileChange?: (files: FileList | null) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  localFiles?: LocalFile[];
  setLocalFiles?: (files: LocalFile[]) => void;
}

const truncateUrl = (url: string, maxLength: number = 40) => {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength - 10);
  const end = url.substring(url.length - 7);
  return `${start}...${end}`;
};

export default function EventForm({
  mode,
  formData,
  setFormData,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  disabled,
  errors = {},
  localFiles = [],
  setLocalFiles,
}: EventFormProps) {
  const isView = mode === "view";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Handle local file selection (no upload yet)
  const handleLocalFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newLocalFiles: LocalFile[] = [];

    Array.from(files).forEach((file) => {
      const localFile: LocalFile = { file };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          localFile.preview = e.target?.result as string;
          // Trigger re-render after preview is loaded
          setLocalFiles?.([...localFiles, ...newLocalFiles]);
        };
        reader.readAsDataURL(file);
      }

      newLocalFiles.push(localFile);
    });

    setLocalFiles?.([...localFiles, ...newLocalFiles]);
  };

  // Remove local file
  const removeLocalFile = (index: number) => {
    const newFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles?.(newFiles);
  };

  // Remove uploaded attachment
  const removeAttachment = (index: number) => {
    setFormData?.({
      ...formData,
      attachments: formData.attachments.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {/* Event Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Event Type{!isView && " *"}
          </label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
              {formData?.type || "—"}
            </div>
          ) : (
            <>
              <select
                disabled={disabled}
                value={formData.type}
                onChange={(e) =>
                  setFormData?.({ ...formData, type: e.target.value })
                }
                className={`w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.type ? "border-red-500 dark:border-red-500" : ""
                }`}
              >
                <option value="">Select event type</option>
                <option value="PPV">PPV</option>
                <option value="LIVESTREAM">Livestream</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-500 mt-1">{errors.type}</p>
              )}
            </>
          )}
        </div>

        {/* Creator */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Creator{!isView && " *"}
          </label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {formData?.creatorProfilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.creatorProfilePicture}
                  alt={formData?.creator || 'Creator'}
                  className="w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : formData?.creator ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  {formData.creator.substring(0, 2).toUpperCase()}
                </div>
              ) : null}
              <span>{formData?.creator || "Not set"}</span>
            </div>
          ) : (
            <>
              <ModelsDropdownList
                disabled={disabled}
                hasError={!!errors.creator}
                className="w-full"
                value={formData.creator}
                onValueChange={(value) =>
                  setFormData?.({ ...formData, creator: value })
                }
                placeholder="Choose creator..."
              />
              {errors.creator && (
                <p className="text-xs text-red-500 mt-1">{errors.creator}</p>
              )}
            </>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <Calendar className="h-3.5 w-3.5" /> Date{!isView && " *"}
          </label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
              {formData?.date ? formatDate(new Date(formData.date)) : "Not set"}
            </div>
          ) : (
            <>
              <input
                type="date"
                disabled={disabled}
                value={formData.date}
                onChange={(e) =>
                  setFormData?.({ ...formData, date: e.target.value })
                }
                className={`w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.date ? "border-red-500 dark:border-red-500" : ""
                }`}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date}</p>
              )}
            </>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <Clock className="h-3.5 w-3.5" /> Time
          </label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
              {formData?.time || "Not set"}
            </div>
          ) : (
            <input
              type="time"
              disabled={disabled}
              value={formData.time}
              onChange={(e) =>
                setFormData?.({ ...formData, time: e.target.value })
              }
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {/* Conditional fields based on event type (Status removed) */}
        {/* Creator remains */}

        {/* PPV specific fields (optional) */}
        {(!isView && formData?.type === "PPV") ||
        (isView && formData?.type === "PPV") ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Content Link
              </label>
              {isView ? (
                formData?.contentLink ? (
                  <a
                    href={formData.contentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-blue-600 dark:text-blue-400 hover:underline block truncate"
                    title={formData.contentLink}
                  >
                    {truncateUrl(formData.contentLink)}
                  </a>
                ) : (
                  <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                    —
                  </div>
                )
              ) : (
                <input
                  type="url"
                  disabled={disabled}
                  value={formData.contentLink || ""}
                  onChange={(e) =>
                    setFormData?.({ ...formData, contentLink: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Edited Video Link
              </label>
              {isView ? (
                formData?.editedVideoLink ? (
                  <a
                    href={formData.editedVideoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-blue-600 dark:text-blue-400 hover:underline block truncate"
                    title={formData.editedVideoLink}
                  >
                    {truncateUrl(formData.editedVideoLink)}
                  </a>
                ) : (
                  <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                    —
                  </div>
                )
              ) : (
                <input
                  type="url"
                  disabled={disabled}
                  value={formData.editedVideoLink || ""}
                  onChange={(e) =>
                    setFormData?.({
                      ...formData,
                      editedVideoLink: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Flyer Link
              </label>
              {isView ? (
                formData?.flyerLink ? (
                  <a
                    href={formData.flyerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-blue-600 dark:text-blue-400 hover:underline block truncate"
                    title={formData.flyerLink}
                  >
                    {truncateUrl(formData.flyerLink)}
                  </a>
                ) : (
                  <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                    —
                  </div>
                )
              ) : (
                <input
                  type="url"
                  disabled={disabled}
                  value={formData.flyerLink || ""}
                  onChange={(e) =>
                    setFormData?.({ ...formData, flyerLink: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://..."
                />
              )}
            </div>

            {/* Price shown for PPV (optional) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Price (optional)
              </label>
              {isView ? (
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                  {formData?.price
                    ? `$${Number(formData.price).toFixed(2)}`
                    : "Free"}
                </div>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  disabled={disabled}
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData?.({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              )}
            </div>
          </>
        ) : null}

        {/* LIVESTREAM specific fields */}
        {(!isView && formData?.type === "LIVESTREAM") ||
        (isView && formData?.type === "LIVESTREAM") ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Flyer Link
              </label>
              {isView ? (
                formData?.flyerLink ? (
                  <a
                    href={formData.flyerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-blue-600 dark:text-blue-400 hover:underline block truncate"
                    title={formData.flyerLink}
                  >
                    {truncateUrl(formData.flyerLink)}
                  </a>
                ) : (
                  <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                    —
                  </div>
                )
              ) : (
                <input
                  type="url"
                  disabled={disabled}
                  value={formData.flyerLink || ""}
                  onChange={(e) =>
                    setFormData?.({ ...formData, flyerLink: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://..."
                />
              )}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Live Platform
              </label>
              {isView ? (
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
                  {formData?.liveType || "—"}
                </div>
              ) : (
                <select
                  disabled={disabled}
                  value={formData.liveType || ""}
                  onChange={(e) =>
                    setFormData?.({ ...formData, liveType: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select platform</option>
                  <option value="OnlyFans">OnlyFans</option>
                  <option value="Instagram Live">Instagram Live</option>
                  <option value="TikTok Live">TikTok Live</option>
                  <option value="YouTube Live">YouTube Live</option>
                  <option value="Twitch">Twitch</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>
          </>
        ) : null}

        {/* (Removed global Price and Color inputs) */}

        {/* Tags (always last among the top-row inputs) */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <Tag className="h-3.5 w-3.5" /> Tags
          </label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">
              {formData?.tags && formData.tags.length > 0
                ? formData.tags.join(", ")
                : "No tags"}
            </div>
          ) : (
            <input
              type="text"
              disabled={disabled}
              value={formData.tags}
              onChange={(e) =>
                setFormData?.({ ...formData, tags: e.target.value })
              }
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="tag1, tag2"
            />
          )}
        </div>

        {/* Notes */}
        <div className="col-span-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <FileText className="h-3.5 w-3.5" /> Notes / Requests
          </label>
          {isView ? (
            <MarkdownViewer value={formData?.notes || ""} />
          ) : (
            <MarkdownEditor
              disabled={disabled}
              value={formData.notes}
              onChange={(value) => setFormData?.({ ...formData, notes: value })}
              placeholder="Add any notes or special requests here..."
            />
          )}
        </div>

        {/* Attachments */}
        <div className="col-span-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <Upload className="h-3.5 w-3.5" /> Scheduled Screenshot{" "}
            <span className="text-gray-500 dark:text-gray-400">(screenshot of OnlyFans queue)</span>
          </label>

          {isView ? (
            formData?.attachments &&
            Array.isArray(formData.attachments) &&
            formData.attachments.length > 0 ? (
              <AttachmentViewer
                attachments={formData.attachments}
                showTitle
                compact
              />
            ) : (
              <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-500 dark:text-gray-400">
                No attachments
              </div>
            )
          ) : (!formData.attachments || formData.attachments.length === 0) && localFiles.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                handleDragLeave?.(e);
                handleLocalFileChange(e.dataTransfer.files);
              }}
              className={`relative rounded-lg border-2 border-dashed transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${isDragging ? "border-pink-500 bg-pink-50/50 dark:bg-pink-900/20" : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50"}`}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                disabled={disabled}
                onChange={(e) => handleLocalFileChange(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center py-6 px-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 mb-2">
                  <Upload className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show uploaded attachments */}
              {formData.attachments && formData.attachments.map((attachment: TaskAttachment, idx: number) => (
                <div
                  key={`uploaded-${attachment.id || idx}`}
                  className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg group hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors"
                >
                  {attachment.type?.startsWith('image/') && attachment.url ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="p-1.5 rounded bg-pink-50 dark:bg-pink-900/30 flex-shrink-0">
                      <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {(attachment.size / 1024).toFixed(1)} KB • Uploaded
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeAttachment(idx)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Show local files (not uploaded yet) */}
              {localFiles.map((localFile, idx) => (
                <div
                  key={`local-${idx}`}
                  className="flex items-center gap-3 p-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
                >
                  {localFile.preview ? (
                    <img
                      src={localFile.preview}
                      alt={localFile.file.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                      {localFile.file.name}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {(localFile.file.size / 1024).toFixed(1)} KB • Will upload on save
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeLocalFile(idx)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Add more files button */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  disabled={disabled}
                  onChange={(e) => handleLocalFileChange(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="file-upload-more"
                />
                <label
                  htmlFor="file-upload-more"
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Upload className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Add more files
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export helper function for uploading local files to S3
export async function uploadLocalFilesToS3(localFiles: LocalFile[]): Promise<TaskAttachment[]> {
  const uploadedAttachments: TaskAttachment[] = [];

  for (let i = 0; i < localFiles.length; i++) {
    const localFile = localFiles[i];
    const formDataToSend = new FormData();
    formDataToSend.append('file', localFile.file);
    formDataToSend.append('folder', 'content-dates');

    const response = await fetch('/api/upload/s3', {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${localFile.file.name}`);
    }

    const data = await response.json();
    if (data.success && data.attachment) {
      uploadedAttachments.push(data.attachment);
    }
  }

  return uploadedAttachments;
}

export type { LocalFile, TaskAttachment };
