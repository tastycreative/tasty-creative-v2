"use client";

import { Button } from "@/components/ui/button";
import { useContentSubmissionStore } from "@/lib/stores/contentSubmissionStore";
import {
  Upload,
  Zap,
  FileText,
  ExternalLink,
  Filter,
  Calendar,
  DollarSign,
} from "lucide-react";

interface SubmissionsHistoryProps {
  onAttachmentClick: (attachments: any[], startIndex?: number) => void;
  setShowHistory: (show: boolean) => void;
}

export default function SubmissionsHistory({ onAttachmentClick, setShowHistory }: SubmissionsHistoryProps) {
  const {
    submissions,
    filters,
    loadingSubmissions,
    setFilters,
  } = useContentSubmissionStore();

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

  return (
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
                                    onAttachmentClick(
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
                                onAttachmentClick(
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
  );
}