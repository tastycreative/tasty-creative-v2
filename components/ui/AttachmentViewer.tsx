"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TaskAttachment } from '@/lib/stores/boardStore';
import { Download, File, Image, ExternalLink, X, ZoomIn } from 'lucide-react';

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
  const [fullscreenImage, setFullscreenImage] = useState<TaskAttachment | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenImage) {
        handleCloseFullscreen();
      }
    };

    if (fullscreenImage) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [fullscreenImage]);
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
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (attachment: TaskAttachment) => {
    if (isImage(attachment.type)) {
      setFullscreenImage(attachment);
    } else {
      window.open(attachment.url, '_blank');
    }
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
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
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            {/* Thumbnail/Icon */}
            <div className="flex-shrink-0">
              {isImage(attachment.type) ? (
                <div 
                  className={`rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                  onClick={() => handleView(attachment)}
                  title="Click to view image"
                >
                  <img
                    src={attachment.url}
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
        ))}
      </div>

      {/* Fullscreen Image Modal - Using Portal */}
      {fullscreenImage && mounted && createPortal(
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
                <h3 className="text-lg font-medium truncate">{fullscreenImage.name}</h3>
                <p className="text-sm opacity-80">{formatFileSize(fullscreenImage.size)}</p>
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
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.name}
                className="max-w-full max-h-full object-contain"
                style={{ 
                  maxHeight: 'calc(100vh - 120px)',
                  maxWidth: '100%'
                }}
              />
            </div>

            {/* Actions */}
            <div className="absolute bottom-6 right-6 flex gap-3">
              <button
                onClick={() => handleDownload(fullscreenImage)}
                className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.open(fullscreenImage.url, '_blank')}
                className="p-3 bg-black bg-opacity-80 text-white hover:bg-opacity-100 rounded-full transition-all shadow-lg"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}