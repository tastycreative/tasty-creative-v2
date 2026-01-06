"use client";

import React, { useState, useRef } from "react";
import { MessageSquarePlus, X, Send, Star, Bug, Lightbulb, HelpCircle, ThumbsUp, AlertCircle, Loader2, ImagePlus, Trash2 } from "lucide-react";

type FeedbackCategory = "BUG" | "FEATURE" | "IMPROVEMENT" | "GENERAL" | "QUESTION" | "COMPLAINT" | "PRAISE";

// Local preview attachment (before upload)
interface LocalAttachment {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
}

// Uploaded attachment (after S3 upload)
interface UploadedAttachment {
  id: string;
  name: string;
  s3Key: string;
  url: string;
  size: number;
  type: string;
}

interface FeedbackFormData {
  category: FeedbackCategory;
  title: string;
  message: string;
  rating: number | null;
  email: string;
  name: string;
}

const categoryOptions: { value: FeedbackCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "BUG", label: "Bug Report", icon: <Bug className="w-4 h-4" />, color: "text-red-500" },
  { value: "FEATURE", label: "Feature Request", icon: <Lightbulb className="w-4 h-4" />, color: "text-yellow-500" },
  { value: "IMPROVEMENT", label: "Improvement", icon: <AlertCircle className="w-4 h-4" />, color: "text-blue-500" },
  { value: "QUESTION", label: "Question", icon: <HelpCircle className="w-4 h-4" />, color: "text-purple-500" },
  { value: "PRAISE", label: "Praise", icon: <ThumbsUp className="w-4 h-4" />, color: "text-green-500" },
  { value: "GENERAL", label: "General", icon: <MessageSquarePlus className="w-4 h-4" />, color: "text-gray-500" },
];

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "GENERAL",
    title: "",
    message: "",
    rating: null,
    email: "",
    name: "",
  });

  // Handle file selection - just preview locally, don't upload yet
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);

    // Check attachment limit
    if (localAttachments.length >= MAX_ATTACHMENTS) {
      setUploadError(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }

    const file = files[0];

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setLocalAttachments((prev) => [
      ...prev,
      {
        id,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    ]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setLocalAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Upload files to S3 and return the uploaded attachment data
  const uploadFilesToS3 = async (): Promise<UploadedAttachment[]> => {
    const uploadedAttachments: UploadedAttachment[] = [];

    for (const localAttachment of localAttachments) {
      const formDataUpload = new FormData();
      formDataUpload.append("file", localAttachment.file);
      formDataUpload.append("folder", "feedback-attachments");

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const data = await response.json();
      
      // The S3 API returns the attachment data nested under "attachment"
      const attachment = data.attachment || data;
      
      uploadedAttachments.push({
        id: attachment.id,
        name: attachment.name,
        s3Key: attachment.s3Key,
        url: attachment.url,
        size: attachment.size,
        type: attachment.type,
      });
    }

    return uploadedAttachments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to S3 first (if any)
      let uploadedAttachments: UploadedAttachment[] = [];
      if (localAttachments.length > 0) {
        uploadedAttachments = await uploadFilesToS3();
      }

      // Submit feedback with uploaded attachments
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        // Clean up local preview URLs
        localAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
        
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
          setFormData({
            category: "GENERAL",
            title: "",
            message: "",
            rating: null,
            email: "",
            name: "",
          });
          setLocalAttachments([]);
          setUploadError(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = (rating: number) => {
    setFormData((prev) => ({
      ...prev,
      rating: prev.rating === rating ? null : rating,
    }));
  };

  const handleClose = () => {
    // Clean up local preview URLs when closing
    localAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setLocalAttachments([]);
    setIsOpen(false);
    setUploadError(null);
  };

  return (
    <>
      {/* Floating Button - Right side, vertically centered */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-3 py-3 rounded-l-xl shadow-lg transition-all duration-300 hover:pr-4 group opacity-50 hover:opacity-100"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap">
          Feedback
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquarePlus className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Send Feedback</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                Help us improve by sharing your thoughts
              </p>
              <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                Your feedback is anonymous
              </p>
            </div>

            {/* Content */}
            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Thank you!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          formData.category === cat.value
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span className={cat.color}>{cat.icon}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief summary..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us what's on your mind..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Photo Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attach Screenshots <span className="text-gray-400">(optional, max {MAX_ATTACHMENTS})</span>
                  </label>
                  
                  {/* Attachment Previews */}
                  {localAttachments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {localAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          <img
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeAttachment(attachment.id)}
                              className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                            <p className="text-xs text-white truncate">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  {localAttachments.length < MAX_ATTACHMENTS && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="feedback-file-input"
                      />
                      <label
                        htmlFor="feedback-file-input"
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-all border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <ImagePlus className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Add screenshot
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How would you rate your experience? <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            formData.rating && star <= formData.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.message.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {localAttachments.length > 0 ? "Uploading & Submitting..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
