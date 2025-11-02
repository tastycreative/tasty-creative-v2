"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TaskAttachment } from '@/lib/stores/boardStore';
import { Download, File, Image, ExternalLink, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface AttachmentViewerProps {
  attachments: TaskAttachment[];
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export default function AttachmentViewer({
  attachments = [],
  showTitle = true,
  compact = false,
  className = ''
}: AttachmentViewerProps) {
  const [fullscreenAttachments, setFullscreenAttachments] = useState<TaskAttachment[] | null>(null);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<Map<string, string>>(new Map());
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate presigned URLs for attachments on-demand
  useEffect(() => {
    const generateUrls = async () => {
      if (attachments.length === 0) return;

      setIsLoadingUrls(true);
      const urlMap = new Map<string, string>();

      try {
        // Generate presigned URLs for all attachments in parallel
        const urlPromises = attachments.map(async (attachment) => {
          // If attachment already has a URL, use it
          if (attachment.url) {
            urlMap.set(attachment.id, attachment.url);
            return;
          }

          // Otherwise, generate presigned URL from s3Key
          if (attachment.s3Key) {
            try {
              const response = await fetch('/api/upload/s3/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  s3Key: attachment.s3Key,
                  expiresIn: 3600 // 1 hour
                }),
              });

              if (response.ok) {
                const data = await response.json();
                urlMap.set(attachment.id, data.url);
              }
            } catch (error) {
              console.error(`Failed to generate URL for ${attachment.name}:`, error);
            }
          }
        });

        await Promise.all(urlPromises);
        setAttachmentUrls(urlMap);
      } catch (error) {
        console.error('Error generating presigned URLs:', error);
      } finally {
        setIsLoadingUrls(false);
      }
    };

    generateUrls();
  }, [attachments]);

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
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type: string): boolean => {
    return type.startsWith('image/');
  };

  const handleDownload = (attachment: TaskAttachment) => {
    const url = attachmentUrls.get(attachment.id) || attachment.url;
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAttachmentClick = (
    attachments: TaskAttachment[],
    startIndex: number = 0
  ) => {
    const imageAttachments = attachments.filter(att => isImage(att.type));
    if (imageAttachments.length > 0) {
      setFullscreenAttachments(imageAttachments);
      setCurrentAttachmentIndex(startIndex);
    }
  };

  const handleView = (attachment: TaskAttachment) => {
    const url = attachmentUrls.get(attachment.id) || attachment.url;
    if (!url) return;

    if (isImage(attachment.type)) {
      const imageAttachments = attachments.filter(att => isImage(att.type));
      const startIndex = imageAttachments.findIndex(att => att.id === attachment.id);
      handleAttachmentClick(imageAttachments, Math.max(0, startIndex));
    } else {
      window.open(url, '_blank');
    }
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

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Attachments ({attachments.length})
        </h4>
      )}
      
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {attachments.map((attachment) => {
          const attachmentUrl = attachmentUrls.get(attachment.id) || attachment.url;
          
          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {/* Thumbnail/Icon */}
              <div className="flex-shrink-0">
                {isImage(attachment.type) && attachmentUrl ? (
                  <div 
                    className={`rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                    onClick={() => handleView(attachment)}
                    title="Click to view image"
                  >
                    <img
                      src={attachmentUrl}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <File className={`text-gray-500 dark:text-gray-400 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-gray-900 dark:text-gray-100 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {attachment.name}
                </p>
                {!compact && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {isImage(attachment.type) && (
                  <button
                    onClick={() => handleView(attachment)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="View full screen"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
                  {(() => {
                    const currentAttachment = fullscreenAttachments[currentAttachmentIndex];
                    const imageUrl = attachmentUrls.get(currentAttachment.id) || currentAttachment.url;
                    
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={currentAttachment.name}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          maxHeight: "calc(100vh - 120px)",
                          maxWidth: "calc(100vw - 32px)",
                        }}
                      />
                    ) : (
                      <div className="text-white text-center">
                        <p>Loading image...</p>
                      </div>
                    );
                  })()}
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
                  onClick={() => {
                    const currentAttachment = fullscreenAttachments[currentAttachmentIndex];
                    const url = attachmentUrls.get(currentAttachment.id) || currentAttachment.url;
                    if (url) {
                      window.open(url, "_blank");
                    }
                  }}
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
                    (attachment: TaskAttachment, index: number) => {
                      const thumbnailUrl = attachmentUrls.get(attachment.id) || attachment.url;
                      
                      return thumbnailUrl ? (
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
                            src={thumbnailUrl}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : null;
                    }
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}