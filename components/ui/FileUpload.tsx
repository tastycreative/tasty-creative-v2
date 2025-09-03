"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image, File, AlertCircle, Loader2 } from 'lucide-react';
import { TaskAttachment } from '@/lib/stores/boardStore';
import { toast } from 'sonner';

interface FileUploadProps {
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disableAutoSave?: boolean; // Add option to disable immediate callbacks during batch upload
}

export default function FileUpload({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
  className = '',
  disableAutoSave = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]); // Track which files are uploading
  const [localAttachments, setLocalAttachments] = useState<TaskAttachment[]>(attachments); // Local state during upload
  const [removingAttachments, setRemovingAttachments] = useState<string[]>([]); // Track which attachments are being removed

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
    console.log('processFiles called with FileList:', fileList);
    console.log('Number of files:', fileList.length);
    
    // Convert FileList to regular array to prevent mutation issues
    const files = Array.from(fileList);
    console.log('Converted to array:', files.map(f => f.name));
    console.log('Array length:', files.length);
    
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Validating file ${i + 1}:`, file.name, file.size, file.type);
      const validationError = validateFile(file, 0); // Use 0 since we already checked total count above
      
      if (validationError) {
        console.error('Validation error:', validationError);
        setError(validationError);
        setUploading(false);
        return;
      }
    }

    // Add all files to uploading list at once
    const fileNames = files.map(f => f.name);
    console.log('Setting uploading files:', fileNames);
    setUploadingFiles(fileNames);

    // Process files one by one
    console.log(`About to process ${files.length} files in loop`);
    for (let i = 0; i < files.length; i++) {
      console.log(`\n=== LOOP ITERATION ${i + 1}/${files.length} STARTING ===`);
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);

      try {
        console.log(`Starting upload for: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Upload to S3
        const formData = new FormData();
        formData.append('file', file);
        console.log('FormData created, making fetch request...');

        const response = await fetch('/api/upload/s3', {
          method: 'POST',
          body: formData,
        });

        console.log(`Response status for ${file.name}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Upload failed for ${file.name}:`, errorData);
          throw new Error(errorData.error || 'Upload failed');
        }

        const responseData = await response.json();
        console.log(`Response data for ${file.name}:`, responseData);
        
        const { attachment } = responseData;
        newAttachments.push(attachment);
        
        console.log(`Successfully uploaded: ${file.name}`, attachment);
        console.log(`Total attachments so far: ${newAttachments.length}`);
        
      } catch (fileError) {
        console.error(`Failed to upload ${file.name}:`, fileError);
        failedUploads.push(file.name);
        // Continue with other files instead of stopping
      }
      
      try {
        // Remove this file from uploading list
        setUploadingFiles(prev => {
          const updated = prev.filter(name => name !== file.name);
          console.log(`Removing ${file.name} from uploading list. Remaining:`, updated);
          return updated;
        });
        
        console.log(`Finished processing file ${i + 1}/${files.length}: ${file.name}`);
      } catch (error) {
        console.error(`Error in cleanup for ${file.name}:`, error);
      }
    }

    console.log(`=== LOOP COMPLETED ===`);
    console.log(`Total successful uploads: ${newAttachments.length}`, newAttachments);
    console.log(`Failed uploads: ${failedUploads.length}`, failedUploads);

    // Update attachments with all successfully uploaded files at once
    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      console.log('Calling onAttachmentsChange with:', updatedAttachments);
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

    console.log('Setting uploading to false');
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
    console.log('handleFileInput triggered');
    const files = e.target.files;
    console.log('Files from input:', files);
    console.log('Files length:', files?.length);
    
    if (files && files.length > 0) {
      console.log('Calling processFiles with files:', Array.from(files).map(f => f.name));
      processFiles(files);
    } else {
      console.log('No files selected or files is null');
    }
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  const removeAttachment = useCallback(async (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    if (!attachment) return;

    // Mark as removing to prevent flicker - this will hide it from UI immediately
    setRemovingAttachments(prev => [...prev, attachmentId]);

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

      // Then update the attachments state
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      onAttachmentsChange(updatedAttachments);
      
      // Show success toast
      toast.success(`Removed ${attachment.name}`);

    } catch (error) {
      console.warn('Error deleting attachment:', error);
      // If deletion failed, remove from removing list to show the attachment again
      setRemovingAttachments(prev => prev.filter(id => id !== attachmentId));
      toast.error(`Failed to remove ${attachment.name}`);
      return;
    }

    // Clean up - remove from removing list after successful deletion
    setRemovingAttachments(prev => prev.filter(id => id !== attachmentId));
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
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
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
        
        <div className="text-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto text-blue-500 mb-2 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {uploading ? `Uploading ${uploadingFiles.length} file(s)...` : 'Drop files here or click to browse'}
          </p>
          {uploading && uploadingFiles.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Currently uploading: {uploadingFiles.join(', ')}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Max {maxFiles} files, {maxFileSize}MB each
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attachments ({attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.filter(att => !removingAttachments.includes(att.id)).map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Thumbnail/Icon */}
                <div className="flex-shrink-0">
                  {isImage(attachment.type) ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}