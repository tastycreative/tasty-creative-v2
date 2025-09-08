"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image, File, AlertCircle, Paperclip } from 'lucide-react';

// Preview file interface (before uploading to S3)
export interface PreviewFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File; // The actual File object for later upload
  previewUrl?: string; // For image previews
}

interface CommentFilePreviewProps {
  previewFiles: PreviewFile[];
  onPreviewFilesChange: (files: PreviewFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function CommentFilePreview({
  previewFiles = [],
  onPreviewFilesChange,
  maxFiles = 3,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
  className = ''
}: CommentFilePreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File, currentCount: number = previewFiles.length): string | null => {
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

  const processFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    setError(null);

    // Check if total files would exceed limit
    if (previewFiles.length + files.length > maxFiles) {
      setError(`Cannot add ${files.length} files. Maximum ${maxFiles} files allowed (currently have ${previewFiles.length}).`);
      return;
    }

    const newPreviewFiles: PreviewFile[] = [];
    
    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file, 0); // Use 0 since we already checked total count above
      
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Process files and create preview objects
    files.forEach((file) => {
      const previewFile: PreviewFile = {
        id: `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        previewFile.previewUrl = URL.createObjectURL(file);
      }

      newPreviewFiles.push(previewFile);
    });

    // Update preview files
    const updatedPreviewFiles = [...previewFiles, ...newPreviewFiles];
    onPreviewFilesChange(updatedPreviewFiles);
  }, [previewFiles, onPreviewFilesChange, maxFiles, maxFileSize, acceptedTypes]);

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

  const removePreviewFile = useCallback((fileId: string) => {
    const fileToRemove = previewFiles.find(f => f.id === fileId);
    
    // Clean up preview URL if it exists
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const updatedPreviewFiles = previewFiles.filter(f => f.id !== fileId);
    onPreviewFilesChange(updatedPreviewFiles);
  }, [previewFiles, onPreviewFilesChange]);

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
          ${previewFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={previewFiles.length >= maxFiles}
        />
        
        <div className="flex items-center justify-center space-x-2 text-xs">
          <Paperclip className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Attach files ({maxFiles} max, {maxFileSize}MB each)
          </span>
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

      {/* Preview Files */}
      {previewFiles.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {previewFiles.map((previewFile) => (
              <div
                key={previewFile.id}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md group"
              >
                <div className="flex-shrink-0">
                  {isImage(previewFile.type) ? (
                    <Image className="w-3 h-3 text-blue-500" />
                  ) : (
                    <File className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <span className="text-xs text-blue-700 dark:text-blue-300 truncate max-w-20">
                  {previewFile.name}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {formatFileSize(previewFile.size)}
                </span>
                <span className="text-xs text-blue-500 italic">
                  pending
                </span>
                <button
                  onClick={() => removePreviewFile(previewFile.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-red-500 transition-all"
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
