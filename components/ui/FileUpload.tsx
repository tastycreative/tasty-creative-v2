"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image, File, AlertCircle, Loader2 } from 'lucide-react';
import { TaskAttachment } from '@/lib/stores/boardStore';
import { toast } from 'sonner';

// Extended interface for local files with preview
export interface LocalFilePreview {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string; // For local preview (blob URL)
}

interface FileUploadProps {
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disableAutoSave?: boolean; // Add option to disable immediate callbacks during batch upload
  // New props for deferred upload mode
  uploadOnSubmit?: boolean; // If true, files are only uploaded when explicitly triggered
  localFiles?: LocalFilePreview[]; // Local files waiting to be uploaded
  onLocalFilesChange?: (files: LocalFilePreview[]) => void;
}

export default function FileUpload({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
  className = '',
  disableAutoSave = false,
  uploadOnSubmit = false,
  localFiles = [],
  onLocalFilesChange
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]); // Track which files are uploading
  const [localAttachments, setLocalAttachments] = useState<TaskAttachment[]>(attachments); // Local state during upload
  const [removingAttachments, setRemovingAttachments] = useState<string[]>([]); // Track which attachments are being removed

  const validateFile = (file: File, currentCount: number = attachments.length + localFiles.length): string | null => {
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

    // Check total count
    const totalCount = attachments.length + localFiles.length + files.length;
    if (totalCount > maxFiles) {
      setError(`Cannot add ${files.length} files. Maximum ${maxFiles} files allowed (currently have ${attachments.length + localFiles.length}).`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file, attachments.length + localFiles.length);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // If uploadOnSubmit is false, upload immediately (backward compatibility)
    if (!uploadOnSubmit) {
      await uploadFilesImmediately(files);
    } else {
      // Add to local files for preview
      const newLocalFiles: LocalFilePreview[] = [];
      
      for (const file of files) {
        // Check if this file is already in localFiles to prevent duplicates
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        const isDuplicate = localFiles.some(localFile => 
          `${localFile.name}-${localFile.size}-${localFile.file.lastModified}` === fileKey
        );
        
        if (isDuplicate) {
          console.log(`File ${file.name} is already added, skipping duplicate`);
          continue;
        }
        
        const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        
        newLocalFiles.push({
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl
        });
      }

      if (newLocalFiles.length > 0 && onLocalFilesChange) {
        onLocalFilesChange([...localFiles, ...newLocalFiles]);
      }
      
      if (newLocalFiles.length === 1) {
        toast.success(`Added ${newLocalFiles[0].name} for upload`);
      } else if (newLocalFiles.length > 1) {
        toast.success(`Added ${newLocalFiles.length} files for upload`);
      } else {
        toast.info('No new files added (duplicates detected)');
      }
    }
  }, [attachments, localFiles, onLocalFilesChange, maxFiles, maxFileSize, acceptedTypes, uploadOnSubmit]);

  const uploadFilesImmediately = async (files: File[]) => {
    setUploading(true);
    const newAttachments: TaskAttachment[] = [];
    const failedUploads: string[] = [];

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
        
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        failedUploads.push(file.name);
      }
    }

    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsChange(updatedAttachments);
      
      if (newAttachments.length === 1) {
        toast.success(`Successfully uploaded ${newAttachments[0].name}`);
      } else {
        toast.success(`Successfully uploaded ${newAttachments.length} files`);
      }
    }

    if (failedUploads.length > 0) {
      const errorMessage = `Failed to upload: ${failedUploads.join(', ')}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setUploading(false);
  };

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

  const removeLocalFile = useCallback((fileId: string) => {
    const fileToRemove = localFiles.find(f => f.id === fileId);
    if (fileToRemove && onLocalFilesChange) {
      // Clean up blob URL
      URL.revokeObjectURL(fileToRemove.previewUrl);
      
      const updatedFiles = localFiles.filter(f => f.id !== fileId);
      onLocalFilesChange(updatedFiles);
      
      toast.success(`Removed ${fileToRemove.name}`);
    }
  }, [localFiles, onLocalFilesChange]);

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
          disabled={uploading || (attachments.length + localFiles.length) >= maxFiles}
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
          {uploadOnSubmit && localFiles.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              {localFiles.length} file(s) ready for upload
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

      {/* Files Preview - both uploaded and local files */}
      {(attachments.length > 0 || localFiles.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Files ({attachments.length + localFiles.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Uploaded attachments */}
            {attachments.filter(att => !removingAttachments.includes(att.id)).map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
              >
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Uploaded • {formatFileSize(attachment.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove uploaded file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Local file previews */}
            {localFiles.map((localFile) => (
              <div
                key={localFile.id}
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                <div className="flex-shrink-0">
                  {isImage(localFile.type) ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={localFile.previewUrl}
                        alt={localFile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {localFile.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Ready to upload • {formatFileSize(localFile.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeLocalFile(localFile.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
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

// Function to upload all local files (for use with uploadOnSubmit mode)
export const uploadAllLocalFiles = async (
  localFiles: LocalFilePreview[],
  attachments: TaskAttachment[],
  onAttachmentsChange: (attachments: TaskAttachment[]) => void,
  onLocalFilesChange?: (files: LocalFilePreview[]) => void
): Promise<TaskAttachment[]> => {
  if (localFiles.length === 0) return [];
  
  // Remove duplicates based on file name, size, and last modified date
  const uniqueFiles: LocalFilePreview[] = [];
  const seenFiles = new Set<string>();
  
  for (const localFile of localFiles) {
    const fileKey = `${localFile.name}-${localFile.size}-${localFile.file.lastModified}`;
    if (!seenFiles.has(fileKey)) {
      seenFiles.add(fileKey);
      uniqueFiles.push(localFile);
    } else {
      console.log(`Skipping duplicate file: ${localFile.name}`);
    }
  }
  
  const newAttachments: TaskAttachment[] = [];
  const failedUploads: string[] = [];

  for (const localFile of uniqueFiles) {
    try {
      console.log(`Uploading file: ${localFile.name} (${localFile.size} bytes)`);
      
      const formData = new FormData();
      formData.append('file', localFile.file);

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
      console.log(`Successfully uploaded: ${localFile.name} -> S3 key: ${attachment.s3Key}`);
      
    } catch (error) {
      console.error(`Failed to upload ${localFile.name}:`, error);
      failedUploads.push(localFile.name);
    }
  }

  // Clean up all blob URLs
  localFiles.forEach(localFile => {
    URL.revokeObjectURL(localFile.previewUrl);
  });

  // Update attachments and clear local files
  const updatedAttachments = [...attachments, ...newAttachments];
  onAttachmentsChange(updatedAttachments);
  if (onLocalFilesChange) {
    onLocalFilesChange([]);
  }

  if (failedUploads.length > 0) {
    const errorMessage = `Failed to upload: ${failedUploads.join(', ')}`;
    toast.error(errorMessage);
  }

  return newAttachments;
};