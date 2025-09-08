"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image, File, AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { TaskAttachment } from '@/lib/stores/boardStore';
import { toast } from 'sonner';

interface CommentFileUploadProps {
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function CommentFileUpload({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 3,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
  className = ''
}: CommentFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File, currentCount: number = attachments.length): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }
    
    if (!acceptedTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported.`;
    }
    
    if (currentCount >= maxFiles) {
      return `Maximum ${maxFiles} files allowed.`;
    }
    
    return null;
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    setError(null);
    setUploading(true);

    const newAttachments: TaskAttachment[] = [];
    const failedUploads: string[] = [];
    
    // Check if total files would exceed limit
    if (attachments.length + files.length > maxFiles) {
      setError(`Cannot upload ${files.length} files. Maximum ${maxFiles} files allowed (currently have ${attachments.length}).`);
      setUploading(false);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file, 0); // Use 0 since we already checked total count above
      
      if (validationError) {
        setError(validationError);
        setUploading(false);
        return;
      }
    }

    // Process files one by one
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/s3', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const responseData = await response.json();
        const { attachment } = responseData;
        newAttachments.push(attachment);
        
      } catch (fileError) {
        console.error(`Failed to upload ${file.name}:`, fileError);
        failedUploads.push(file.name);
      }
    }

    // Update attachments with all successfully uploaded files at once
    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsChange(updatedAttachments);
      
      // Show success toast
      if (newAttachments.length === 1) {
        toast.success(`Successfully uploaded ${newAttachments[0].name}`);
      } else {
        toast.success(`Successfully uploaded ${newAttachments.length} files`);
      }
    }

    // Show error for failed uploads
    if (failedUploads.length > 0) {
      const errorMessage = `Failed to upload: ${failedUploads.join(', ')}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setUploading(false);
  }, [attachments, onAttachmentsChange, maxFiles, maxFileSize, acceptedTypes]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  const removeAttachment = useCallback(async (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    if (!attachment) return;

    try {
      // Delete from S3 first
      if ('s3Key' in attachment && attachment.s3Key) {
        const response = await fetch(`/api/upload/s3?key=${encodeURIComponent(attachment.s3Key)}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.warn('Failed to delete file from S3, but continuing...');
        }
      }

      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      onAttachmentsChange(updatedAttachments);
      
      toast.success(`Removed ${attachment.name}`);
    } catch (error) {
      console.warn('Error deleting attachment:', error);
      toast.error(`Failed to remove ${attachment.name}`);
    }
  }, [attachments, onAttachmentsChange]);

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

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Compact Upload Area */}
      <div
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        className={`
          relative border border-dashed rounded-md p-2 transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
          ${attachments.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || attachments.length >= maxFiles}
        />
        
        <div className="flex items-center justify-center space-x-2 text-xs">
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
            </>
          ) : (
            <>
              <Paperclip className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Attach files ({maxFiles} max, {maxFileSize}MB each)
              </span>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-700 dark:text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Compact Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md group"
              >
                <div className="flex-shrink-0">
                  {isImage(attachment.type) ? (
                    <Image className="w-3 h-3 text-gray-500" />
                  ) : (
                    <File className="w-3 h-3 text-gray-500" />
                  )}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-20">
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)}
                </span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}