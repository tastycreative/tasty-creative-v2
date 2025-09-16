"use client";

import { useState, useEffect } from "react";
import { LocalFilePreview, uploadAllLocalFiles } from "@/components/ui/FileUpload";
import { useContentSubmissionStore } from "@/lib/stores/contentSubmissionStore";
import OtpPtrForm from "@/components/pod-new/otp-ptr/OtpPtrForm";
import SubmissionsHistory from "@/components/pod-new/otp-ptr/SubmissionsHistory";
import FullscreenAttachmentModal from "@/components/pod-new/otp-ptr/FullscreenAttachmentModal";
import {
  Upload,
  Zap,
  Clock,
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
    attachments,
    setAttachments,
    submitContent,
    fetchSubmissions,
    refreshSubmissions,
    filters,
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
          <OtpPtrForm
            localFiles={localFiles}
            setLocalFiles={setLocalFiles}
            onSubmit={handleSubmit}
          />
        ) : (
          <SubmissionsHistory
            onAttachmentClick={handleAttachmentClick}
            setShowHistory={setShowHistory}
          />
        )}

        <FullscreenAttachmentModal
          attachments={fullscreenAttachments}
          currentIndex={currentAttachmentIndex}
          mounted={mounted}
          onClose={handleCloseFullscreen}
          onNavigate={navigateAttachment}
          onIndexChange={setCurrentAttachmentIndex}
        />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}