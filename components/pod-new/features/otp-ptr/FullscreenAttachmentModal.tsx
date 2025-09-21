"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";

interface FullscreenAttachmentModalProps {
  attachments: any[] | null;
  currentIndex: number;
  mounted: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onIndexChange: (index: number) => void;
}

export default function FullscreenAttachmentModal({
  attachments,
  currentIndex,
  mounted,
  onClose,
  onNavigate,
  onIndexChange,
}: FullscreenAttachmentModalProps) {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!attachments) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onNavigate("prev");
      } else if (e.key === "ArrowRight") {
        onNavigate("next");
      }
    };

    if (attachments) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [attachments, currentIndex, onClose, onNavigate]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = (attachment: any) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!attachments || attachments.length === 0 || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-70 text-white">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium truncate">
              {attachments[currentIndex].name}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm opacity-80">
                {formatFileSize(attachments[currentIndex].size)}
              </p>
              {attachments.length > 1 && (
                <p className="text-sm opacity-80">
                  {currentIndex + 1} of {attachments.length}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
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
              src={attachments[currentIndex].url}
              alt={attachments[currentIndex].name}
              className="max-w-full max-h-full object-contain"
              style={{
                maxHeight: "calc(100vh - 120px)",
                maxWidth: "calc(100vw - 32px)",
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={() => onNavigate("prev")}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all shadow-lg"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => onNavigate("next")}
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
            onClick={() => handleDownload(attachments[currentIndex])}
            className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              window.open(attachments[currentIndex].url, "_blank")
            }
            className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Strip for Multiple Images */}
        {attachments.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-70 p-3 rounded-full">
            {attachments.map((attachment: any, index: number) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${
                  index === currentIndex
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
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}