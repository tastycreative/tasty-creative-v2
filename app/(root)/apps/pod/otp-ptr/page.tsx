"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload, { LocalFilePreview, uploadAllLocalFiles } from "@/components/ui/FileUpload";
import { TaskAttachment } from "@/lib/stores/boardStore";
import { useContentSubmissionStore } from "@/lib/stores/contentSubmissionStore";
import ModelsDropdownList from "@/components/ModelsDropdownList";
import {
  Upload,
  Zap,
  FileText,
  Image,
  Link2,
  User,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function OtpPtrPage() {
  const [showHistory, setShowHistory] = useState(false);
  const [fullscreenAttachments, setFullscreenAttachments] = useState<
    any[] | null
  >(null);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFilePreview[]>([]);

  // Zustand store
  const {
    // Form state
    submissionType,
    formData,
    attachments,
    isSubmitting,
    isSubmitted,
    
    // History state
    submissions,
    filters,
    pagination,
    loadingSubmissions,
    
    // Actions
    setSubmissionType,
    updateFormData,
    setAttachments,
    submitContent,
    setFilters,
    fetchSubmissions,
    refreshSubmissions,
    isFormValid
  } = useContentSubmissionStore();

  // Fetch submissions when component mounts or filter changes
  useEffect(() => {
    if (showHistory) {
      fetchSubmissions();
    }
  }, [showHistory, filters.type, fetchSubmissions]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle fullscreen modal keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenAttachments) return;

      if (e.key === "Escape") {
        handleCloseFullscreen();
      } else if (e.key === "ArrowLeft") {
        navigateAttachment("prev");
      } else if (e.key === "ArrowRight") {
        navigateAttachment("next");
      }
    };

    if (fullscreenAttachments) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullscreenAttachments, currentAttachmentIndex]);

  const handleSubmit = async () => {
    // First upload any local files to S3
    if (localFiles.length > 0) {
      await uploadAllLocalFiles(localFiles, attachments, setAttachments, setLocalFiles);
    }

    const success = await submitContent();
    
    // Refresh submissions if history is visible and submission was successful
    if (success && showHistory) {
      refreshSubmissions();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
      case "PROCESSING":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30";
      case "TASK_CREATED":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
      case "COMPLETED":
        return "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30";
      case "CANCELLED":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleAttachmentClick = (
    attachments: any[],
    startIndex: number = 0
  ) => {
    setFullscreenAttachments(attachments);
    setCurrentAttachmentIndex(startIndex);
  };

  const handleCloseFullscreen = () => {
    setFullscreenAttachments(null);
    setCurrentAttachmentIndex(0);
  };

  const navigateAttachment = (direction: "prev" | "next") => {
    if (!fullscreenAttachments) return;

    if (direction === "prev") {
      setCurrentAttachmentIndex((prev) =>
        prev > 0 ? prev - 1 : fullscreenAttachments.length - 1
      );
    } else {
      setCurrentAttachmentIndex((prev) =>
        prev < fullscreenAttachments.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleDownload = (attachment: any) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full px-6 py-12 max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Content Submission
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Submit new content with streamlined workflow automation
            </p>
          </div>

          {/* Page Navigation Tabs */}
          <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-1">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                !showHistory
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Upload className="h-4 w-4" />
              New Submission
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                showHistory
                  ? "bg-gray-800 dark:bg-gray-700 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              History
            </button>
          </div>
        </div>

        {!showHistory ? (
          /* Modern Submission Form */
          <div className="relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/15 to-pink-50/30 dark:from-blue-950/15 dark:via-purple-950/8 dark:to-pink-950/15 rounded-3xl" />

            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-gray-700/60 shadow-2xl overflow-hidden">
              {/* Header Section */}
              <div className="relative bg-gradient-to-br from-gray-50/90 via-white/50 to-gray-50/90 dark:from-gray-800/90 dark:via-gray-900/50 dark:to-gray-800/90 backdrop-blur-xl px-10 py-8 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Create New Submission
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-base mt-1">
                          Submit your content with automated workflow processing
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modern Type Toggle */}
                  <div className="relative">
                    <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                      <div
                        className={`absolute inset-y-2 w-[calc(50%-4px)] bg-gradient-to-r ${
                          submissionType === "otp"
                            ? "from-blue-500 to-blue-600 left-2"
                            : "from-purple-500 to-purple-600 left-[calc(50%+2px)]"
                        } rounded-xl shadow-lg transition-all duration-500 ease-out`}
                      />

                      <button
                        onClick={() => setSubmissionType("otp")}
                        className={`relative z-10 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 min-w-[120px] justify-center ${
                          submissionType === "otp"
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Upload className="h-5 w-5" />
                        <span>OTP</span>
                      </button>
                      <button
                        onClick={() => setSubmissionType("ptr")}
                        className={`relative z-10 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 min-w-[120px] justify-center ${
                          submissionType === "ptr"
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Zap className="h-5 w-5" />
                        <span>PTR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {/* Main Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Main Form Fields */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* First Row: Model Selection and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Model Selection */}
                      <div className="group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <label className="text-base font-semibold text-gray-900 dark:text-white block">
                              Model Selection
                            </label>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                              Choose your content creator
                            </p>
                          </div>
                        </div>
                        <ModelsDropdownList
                          value={formData.modelName}
                          onValueChange={(value) =>
                            updateFormData("modelName", value)
                          }
                          placeholder="Choose your model..."
                          className="h-12 w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md transition-all duration-300 focus:border-pink-500 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>

                      {/* Priority */}
                      <div className="group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                            <AlertTriangle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <label className="text-base font-semibold text-gray-900 dark:text-white block">
                              Priority Level
                            </label>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                              Set processing urgency
                            </p>
                          </div>
                        </div>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) =>
                            updateFormData("priority", value)
                          }
                        >
                          <SelectTrigger className="h-12 w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all duration-300 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20">
                            <SelectValue placeholder="Select priority level..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border shadow-lg bg-white dark:bg-gray-900">
                            <SelectItem
                              value="urgent"
                              className="text-sm py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <div>
                                  <div className="font-medium text-red-700 dark:text-red-400">
                                    Urgent
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Rush delivery
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="high" className="text-sm py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                                <div>
                                  <div className="font-medium text-orange-700 dark:text-orange-400">
                                    High
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Next in queue
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="normal"
                              className="text-sm py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                <div>
                                  <div className="font-medium text-blue-700 dark:text-blue-400">
                                    Normal
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Standard processing
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="low" className="text-sm py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-400">
                                    Low
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    When available
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Drive Link */}
                    <div className="group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <Link2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-base font-semibold text-gray-900 dark:text-white block">
                            Google Drive Link
                          </label>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                            Share folder or file URL
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.driveLink}
                          onChange={(e) =>
                            updateFormData("driveLink", e.target.value)
                          }
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="w-full h-12 pl-4 pr-12 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Content Description */}
                    <div className="group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-base font-semibold text-gray-900 dark:text-white block">
                            Content Description
                          </label>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                            Describe your content in detail
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={formData.contentDescription}
                          onChange={(e) =>
                            updateFormData(
                              "contentDescription",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Alanna x Keiran Lee BG Scene - 40 min tape!"
                          rows={4}
                          className="w-full text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none p-3"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                          <span className="font-medium">
                            {formData.contentDescription.length}
                          </span>
                          <span>chars</span>
                        </div>
                      </div>
                    </div>

                    {/* PTR-Specific Fields */}
                    {submissionType === 'ptr' && (
                      <>
                        {/* Release Date and Time */}
                        <div className="group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <label className="text-base font-semibold text-gray-900 dark:text-white block">
                                Release Date & Time
                              </label>
                              <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                                When should this content be released?
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Release Date */}
                            <div className="relative">
                              <input
                                type="date"
                                value={formData.releaseDate}
                                onChange={(e) =>
                                  updateFormData("releaseDate", e.target.value)
                                }
                                className="w-full h-12 px-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-300"
                              />
                            </div>
                            {/* Release Time */}
                            <div className="relative">
                              <input
                                type="time"
                                value={formData.releaseTime}
                                onChange={(e) =>
                                  updateFormData("releaseTime", e.target.value)
                                }
                                className="w-full h-12 px-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-300"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Minimum Price */}
                        <div className="group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                              <DollarSign className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <label className="text-base font-semibold text-gray-900 dark:text-white block">
                                Minimum Price
                              </label>
                              <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                                Set the minimum price for this content
                              </p>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">
                              $
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.minimumPrice}
                              onChange={(e) =>
                                updateFormData("minimumPrice", e.target.value)
                              }
                              placeholder="50.00"
                              className="w-full h-12 pl-8 pr-4 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column - Screenshots */}
                  <div className="lg:col-span-1">
                    <div className="group h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <Image className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-base font-semibold text-gray-900 dark:text-white block">
                            Screenshots
                          </label>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                            Upload images (max 5)
                          </p>
                        </div>
                      </div>
                      <div className=" border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 h-[calc(100%-4rem)]">
                        <FileUpload
                          attachments={attachments}
                          onAttachmentsChange={setAttachments}
                          localFiles={localFiles}
                          onLocalFilesChange={setLocalFiles}
                          uploadOnSubmit={true}
                          maxFiles={5}
                          acceptedTypes={[
                            "image/jpeg",
                            "image/png",
                            "image/gif",
                            "image/webp",
                          ]}
                          className="border-none bg-transparent h-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="relative bg-gray-50/80 dark:bg-gray-800/80 px-8 py-8 border-t border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Button
                    onClick={(e) => {
                      console.log("🔥 Button clicked!", e);
                      handleSubmit();
                    }}
                    disabled={!isFormValid() || isSubmitting}
                    className={`w-full h-14 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group shadow-lg ${
                      isSubmitted
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                        : isFormValid() && !isSubmitting
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {!isSubmitted && isFormValid() && !isSubmitting && (
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    <span className="relative flex items-center justify-center gap-3">
                      {isSubmitted ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Submitted Successfully!</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                          <span>Processing Submission...</span>
                        </>
                      ) : (
                        <>
                          {submissionType === "otp" ? (
                            <Upload className="h-5 w-5" />
                          ) : (
                            <Zap className="h-5 w-5" />
                          )}
                          <span>
                            Submit {submissionType.toUpperCase()} & Create
                            Workflow
                          </span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </span>
                  </Button>

                  <div className="flex items-center justify-center mt-4 gap-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isSubmitted
                          ? "bg-green-500"
                          : isSubmitting
                            ? "bg-blue-500 animate-pulse"
                            : isFormValid()
                              ? "bg-blue-400"
                              : "bg-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isSubmitted
                          ? "text-green-600 dark:text-green-400"
                          : isSubmitting
                            ? "text-blue-600 dark:text-blue-400"
                            : isFormValid()
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isSubmitted
                        ? "Content submitted and task created!"
                        : isSubmitting
                          ? "Processing your submission..."
                          : isFormValid()
                            ? "Ready to submit your content"
                            : "Please fill in all required fields"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Submissions History */
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Submission History
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track your content submissions and their status
                  </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ type: e.target.value as any })}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="otp">OTP Only</option>
                    <option value="ptr">PTR Only</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loadingSubmissions ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Submissions List */
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {submissions.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        <div className="col-span-1">Type</div>
                        <div className="col-span-2">Model</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Attachments</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Created</div>
                        <div className="col-span-1">Actions</div>
                      </div>

                      {/* Submissions */}
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center"
                        >
                          {/* Type */}
                          <div className="col-span-1">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                submission.submissionType.toUpperCase() === "OTP"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              }`}
                            >
                              {submission.submissionType.toUpperCase() === "OTP" ? (
                                <Upload className="h-3 w-3" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              {submission.submissionType.toUpperCase()}
                            </div>
                          </div>

                          {/* Model */}
                          <div className="col-span-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {submission.modelName}
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                submission.priority.toUpperCase() === "URGENT"
                                  ? "text-red-600 dark:text-red-400"
                                  : submission.priority.toUpperCase() === "HIGH"
                                    ? "text-orange-600 dark:text-orange-400"
                                    : submission.priority.toUpperCase() === "NORMAL"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {submission.priority.toUpperCase()}
                            </p>
                          </div>

                          {/* Description */}
                          <div className="col-span-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {submission.contentDescription}
                            </p>
                            {submission.submissionType.toUpperCase() === "PTR" && 
                             (submission.releaseDate || submission.minimumPrice) && (
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                {submission.releaseDate && submission.releaseTime && (
                                  <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {submission.releaseDate} at {submission.releaseTime}
                                  </span>
                                )}
                                {submission.minimumPrice && (
                                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${submission.minimumPrice}
                                  </span>
                                )}
                              </div>
                            )}
                            {submission.task && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Task: {submission.task.title}
                              </p>
                            )}
                          </div>

                          {/* Attachments */}
                          <div className="col-span-2">
                            {submission.screenshotAttachments &&
                            submission.screenshotAttachments.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {submission.screenshotAttachments
                                    .slice(0, 3)
                                    .map((attachment: any, index: number) => (
                                      <div
                                        key={index}
                                        className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white dark:border-gray-800 hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                                        onClick={() =>
                                          handleAttachmentClick(
                                            submission.screenshotAttachments || [],
                                            index
                                          )
                                        }
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                </div>
                                {submission.screenshotAttachments.length >
                                  3 && (
                                  <button
                                    onClick={() =>
                                      handleAttachmentClick(
                                        submission.screenshotAttachments || [],
                                        3
                                      )
                                    }
                                    className="text-xs text-blue-500 dark:text-blue-400 hover:underline ml-1"
                                  >
                                    +
                                    {submission.screenshotAttachments.length -
                                      3}{" "}
                                    more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                No attachments
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}
                            >
                              {submission.status.replace("_", " ")}
                            </span>
                          </div>

                          {/* Created */}
                          <div className="col-span-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(submission.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                submission.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <button
                              onClick={() =>
                                window.open(submission.driveLink, "_blank")
                              }
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Open Google Drive"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No submissions yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Your content submissions will appear here once you
                        create them.
                      </p>
                      <Button
                        onClick={() => setShowHistory(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Create Your First Submission
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen Attachment Modal */}
        {fullscreenAttachments &&
          fullscreenAttachments.length > 0 &&
          mounted &&
          createPortal(
            <div
              className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              onClick={handleCloseFullscreen}
            >
              <div
                className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-black bg-opacity-70 text-white">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">
                      {fullscreenAttachments[currentAttachmentIndex].name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm opacity-80">
                        {formatFileSize(
                          fullscreenAttachments[currentAttachmentIndex].size
                        )}
                      </p>
                      {fullscreenAttachments.length > 1 && (
                        <p className="text-sm opacity-80">
                          {currentAttachmentIndex + 1} of{" "}
                          {fullscreenAttachments.length}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCloseFullscreen}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors ml-4 flex-shrink-0"
                    title="Close (ESC)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center p-4 relative">
                  <div className="flex items-center justify-center w-full h-full">
                    <img
                      src={fullscreenAttachments[currentAttachmentIndex].url}
                      alt={fullscreenAttachments[currentAttachmentIndex].name}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        maxHeight: "calc(100vh - 120px)",
                        maxWidth: "calc(100vw - 32px)",
                      }}
                    />
                  </div>

                  {/* Navigation Arrows */}
                  {fullscreenAttachments.length > 1 && (
                    <>
                      <button
                        onClick={() => navigateAttachment("prev")}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all shadow-lg"
                        title="Previous (←)"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => navigateAttachment("next")}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all shadow-lg"
                        title="Next (→)"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute bottom-6 right-6 flex gap-3">
                  <button
                    onClick={() =>
                      handleDownload(
                        fullscreenAttachments[currentAttachmentIndex]
                      )
                    }
                    className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        fullscreenAttachments[currentAttachmentIndex].url,
                        "_blank"
                      )
                    }
                    className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>

                {/* Thumbnail Strip for Multiple Images */}
                {fullscreenAttachments.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-70 p-3 rounded-full">
                    {fullscreenAttachments.map(
                      (attachment: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentAttachmentIndex(index)}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${
                            index === currentAttachmentIndex
                              ? "border-white shadow-lg"
                              : "border-gray-500 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
