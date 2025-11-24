"use client";

import { createPortal } from "react-dom";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { X, Calendar, Clock, DollarSign, Tag, User, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import { TaskAttachment } from "@/lib/stores/boardStore";

interface EventDetailModalProps {
  event: ContentEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null;

  // Static data for now
  const staticAttachments: TaskAttachment[] = [
    {
      id: "static-1",
      name: "promo-image.jpg",
      url: "https://picsum.photos/800/600",
      type: "image/jpeg",
      size: 204800,
      uploadedAt: new Date(),
      uploadedBy: "user-1"
    },
    {
      id: "static-2",
      name: "content-schedule.pdf",
      url: "#",
      type: "application/pdf",
      size: 153600,
      uploadedAt: new Date(),
      uploadedBy: "user-1"
    },
  ];

  const staticNotes = "**Important:** Please review the content before posting.\n\n*Special requests:*\n- Use high-quality images\n- Add watermark\n- Schedule for peak hours";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status: ContentEvent["status"]) => {
    const badges = {
      SCHEDULED: {
        text: "Scheduled",
        className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
      },
      COMPLETED: {
        text: "Completed",
        className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
      },
      CANCELLED: {
        text: "Cancelled",
        className: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
      },
    };
    return badges[status];
  };

  const statusBadge = getStatusBadge(event.status);

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
              Event Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Event Type
                </label>
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                  {event.type}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </label>
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                  {formatDate(event.date)}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </label>
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                  {event.time || "Not set"}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${statusBadge.className}`}>
                  {statusBadge.text}
                </div>
              </div>

              {/* Creator */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <User className="h-3.5 w-3.5" />
                  Creator
                </label>
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                  {event.creator || "Not set"}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Price
                </label>
                <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                  {event.price ? `$${event.price.toFixed(2)}` : "Free"}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded border-2 ${
                    event.color === 'pink' ? 'bg-pink-500 border-pink-600' :
                    event.color === 'purple' ? 'bg-purple-500 border-purple-600' :
                    event.color === 'blue' ? 'bg-blue-500 border-blue-600' :
                    event.color === 'green' ? 'bg-green-500 border-green-600' :
                    'bg-orange-500 border-orange-600'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{event.color}</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </label>
                {event.tags && event.tags.length > 0 ? (
                  <div className="px-3 py-1.5 max-h-20 overflow-y-auto text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
                    No tags
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="col-span-4">
                <AttachmentViewer
                  attachments={staticAttachments}
                  showTitle={true}
                  compact={true}
                />
              </div>

              {/* Notes/Requests */}
              <div className="col-span-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Notes / Requests
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <ReactMarkdown>{staticNotes}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
