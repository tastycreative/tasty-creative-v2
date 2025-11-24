"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, DollarSign, Tag, FileText, Upload } from "lucide-react";
import { ContentEvent, EventType, EventStatus } from "@/app/(root)/(pod)/content-dates/page";
import MarkdownEditor from "./MarkdownEditor";
import ModelsDropdownList from "@/components/ModelsDropdownList";

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "PPV" as EventType,
    status: "SCHEDULED" as EventStatus,
    creator: "",
    tags: "",
    price: "",
    color: "pink" as ContentEvent["color"],
    notes: "",
    attachments: [] as File[],
  });
  const [isDragging, setIsDragging] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      alert("Date is required");
      return;
    }

    // Generate title from type, creator, and date
    const generatedTitle = `${formData.type}${formData.creator ? ` - ${formData.creator}` : ''} - ${new Date(formData.date).toLocaleDateString()}`;

    const eventData: Partial<ContentEvent> = {
      title: generatedTitle,
      date: new Date(formData.date),
      time: formData.time || undefined,
      type: formData.type,
      status: formData.status,
      creator: formData.creator || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      color: formData.color,
    };

    onSubmit(eventData);

    // Reset form
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      type: "PPV",
      status: "SCHEDULED",
      creator: "",
      tags: "",
      price: "",
      color: "pink",
      notes: "",
      attachments: [],
    });
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Event Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                >
                  <option value="PPV">PPV</option>
                  <option value="LIVESTREAM">Livestream</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Creator */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Creator
                </label>
                <ModelsDropdownList
                  value={formData.creator}
                  onValueChange={(value) => setFormData({ ...formData, creator: value })}
                  placeholder="Choose creator..."
                  className="w-full text-sm [&>button]:px-3 [&>button]:py-1.5 [&>button]:bg-white dark:[&>button]:bg-gray-700 [&>button]:border [&>button]:border-gray-300 dark:[&>button]:border-gray-600 [&>button]:rounded-lg [&>button]:focus:outline-none [&>button]:focus:ring-2 [&>button]:focus:ring-pink-500 [&>button]:text-gray-900 dark:[&>button]:text-gray-100"
                />
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Color
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value as ContentEvent["color"] })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                >
                  <option value="pink">Pink</option>
                  <option value="purple">Purple</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Attachments */}
              <div className="col-span-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Attachments
                </label>

                {formData.attachments.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative rounded-lg border-2 border-dashed transition-all ${
                      isDragging
                        ? "border-pink-500 bg-pink-50/50 dark:bg-pink-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center py-6 px-4 cursor-pointer"
                    >
                      <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 mb-2">
                        <Upload className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, PDF, or any file type
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg group hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="p-1.5 rounded bg-pink-50 dark:bg-pink-900/30">
                            <FileText className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newAttachments = formData.attachments.filter((_, i) => i !== idx);
                            setFormData({ ...formData, attachments: newAttachments });
                          }}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add More Button */}
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="file-upload-more"
                      />
                      <label
                        htmlFor="file-upload-more"
                        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all cursor-pointer"
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

              {/* Notes/Requests - Full width with markdown support */}
              <div className="col-span-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Notes / Requests
                </label>
                <MarkdownEditor
                  value={formData.notes}
                  onChange={(value) => setFormData({ ...formData, notes: value })}
                  placeholder="Add any notes or special requests here..."
                />
              </div>
            </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
