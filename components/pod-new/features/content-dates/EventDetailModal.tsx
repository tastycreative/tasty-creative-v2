"use client";

import { createPortal } from "react-dom";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";
import { X } from "lucide-react";
import EventForm from "./EventForm";

interface EventDetailModalProps {
  event: ContentEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null;

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
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">Event Details</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X className="h-5 w-5 text-gray-600 dark:text-gray-400" /></button>
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <EventForm
              mode="view"
              formData={event}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button onClick={onClose} className="flex-1 px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
