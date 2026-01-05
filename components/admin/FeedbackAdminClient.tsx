"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  ThumbsUp,
  AlertCircle,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Filter,
} from "lucide-react";

interface Feedback {
  id: string;
  category: string;
  title: string | null;
  message: string;
  rating: number | null;
  status: string;
  priority: string;
  pageUrl: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  BUG: { icon: <Bug className="w-4 h-4" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  FEATURE: { icon: <Lightbulb className="w-4 h-4" />, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  IMPROVEMENT: { icon: <AlertCircle className="w-4 h-4" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  QUESTION: { icon: <HelpCircle className="w-4 h-4" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  PRAISE: { icon: <ThumbsUp className="w-4 h-4" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  GENERAL: { icon: <MessageSquare className="w-4 h-4" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  COMPLAINT: { icon: <XCircle className="w-4 h-4" />, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
};

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  NEW: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  REVIEWING: { color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  IN_PROGRESS: { color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  RESOLVED: { color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  CLOSED: { color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  WONT_FIX: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const priorityConfig: Record<string, { color: string; bgColor: string }> = {
  LOW: { color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-700/50" },
  NORMAL: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  HIGH: { color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  URGENT: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

export default function FeedbackAdminClient() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);

      const response = await fetch(`/api/feedback?${params}`);
      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Feedback Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage user feedback submissions
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="WONT_FIX">Won&apos;t Fix</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">All Categories</option>
          <option value="BUG">Bug Report</option>
          <option value="FEATURE">Feature Request</option>
          <option value="IMPROVEMENT">Improvement</option>
          <option value="QUESTION">Question</option>
          <option value="PRAISE">Praise</option>
          <option value="COMPLAINT">Complaint</option>
          <option value="GENERAL">General</option>
        </select>

        {(statusFilter || categoryFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          {pagination.total} total feedback{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No feedback found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {feedbacks.map((feedback) => {
                  const catConfig = categoryConfig[feedback.category] || categoryConfig.GENERAL;
                  const statConfig = statusConfig[feedback.status] || statusConfig.NEW;
                  const prioConfig = priorityConfig[feedback.priority] || priorityConfig.NORMAL;

                  return (
                    <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${catConfig.bgColor}`}>
                          <span className={catConfig.color}>{catConfig.icon}</span>
                          <span className={`text-xs font-medium ${catConfig.color}`}>
                            {feedback.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          {feedback.title && (
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {feedback.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {feedback.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {renderStars(feedback.rating)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statConfig.bgColor} ${statConfig.color}`}>
                          {feedback.status === "NEW" && <Clock className="w-3 h-3" />}
                          {feedback.status === "RESOLVED" && <CheckCircle className="w-3 h-3" />}
                          {feedback.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${prioConfig.bgColor} ${prioConfig.color}`}>
                          {feedback.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(feedback.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedFeedback(feedback)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedFeedback(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Feedback Details
              </h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Category & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${categoryConfig[selectedFeedback.category]?.bgColor || "bg-gray-100"}`}>
                  <span className={categoryConfig[selectedFeedback.category]?.color || "text-gray-600"}>
                    {categoryConfig[selectedFeedback.category]?.icon}
                  </span>
                  <span className={`text-sm font-medium ${categoryConfig[selectedFeedback.category]?.color || "text-gray-600"}`}>
                    {selectedFeedback.category}
                  </span>
                </div>
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig[selectedFeedback.status]?.bgColor} ${statusConfig[selectedFeedback.status]?.color}`}>
                  {selectedFeedback.status.replace("_", " ")}
                </span>
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${priorityConfig[selectedFeedback.priority]?.bgColor} ${priorityConfig[selectedFeedback.priority]?.color}`}>
                  {selectedFeedback.priority}
                </span>
              </div>

              {/* Title */}
              {selectedFeedback.title && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                    {selectedFeedback.title}
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Message</label>
                <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Rating</label>
                <div className="mt-1">{renderStars(selectedFeedback.rating)}</div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Submitted</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>
                {selectedFeedback.pageUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Page URL</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                      {selectedFeedback.pageUrl}
                    </p>
                  </div>
                )}
              </div>

              
              {selectedFeedback.metadata&& (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Metadata</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {String(selectedFeedback.metadata)}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedFeedback.adminNotes && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Admin Notes</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {selectedFeedback.adminNotes}
                  </p>
                </div>
              )}

              {/* ID */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 uppercase">Feedback ID</label>
                <p className="mt-1 text-xs text-gray-500 font-mono">{selectedFeedback.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
