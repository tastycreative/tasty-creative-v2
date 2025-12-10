"use client";

import React, { useState, useCallback } from 'react';
import { X, Upload, Loader2, ImagePlus, Link as LinkIcon, Check } from 'lucide-react';
import ModelsDropdownList from '@/components/ModelsDropdownList';

interface BulkSubmissionModalProps {
  isOpen: boolean;
  teamId: string;
  columnStatus: string;
  onClose: () => void;
  onSubmit: (data: BulkSubmissionData, onProgress?: (stepId: ProgressStep['id'], current?: number, total?: number) => void) => Promise<void>;
}

export interface BulkSubmissionData {
  modelName: string;
  driveLink?: string;
  uploadedFiles?: File[];
  captions?: string[];
  columnStatus: string;
}

export type ProgressStep = {
  id: 'validating' | 'uploading' | 'creating' | 'finalizing';
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
};

export default function BulkSubmissionModal({
  isOpen,
  teamId,
  columnStatus,
  onClose,
  onSubmit
}: BulkSubmissionModalProps) {
  const [formData, setFormData] = useState<BulkSubmissionData>({
    modelName: '',
    driveLink: '',
    uploadedFiles: [],
    captions: [],
    columnStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 'validating', label: 'Validating submission', status: 'pending' },
    { id: 'uploading', label: 'Uploading photos to S3', status: 'pending' },
    { id: 'creating', label: 'Creating task and photo records', status: 'pending' },
    { id: 'finalizing', label: 'Finalizing bulk submission', status: 'pending' },
  ]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleProgressUpdate = (stepId: ProgressStep['id'], current?: number, total?: number) => {
    setProgressSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return { ...step, status: 'in_progress' as const };
      }
      // Mark previous steps as completed
      const stepOrder = ['validating', 'uploading', 'creating', 'finalizing'];
      const currentIndex = stepOrder.indexOf(stepId);
      const thisIndex = stepOrder.indexOf(step.id);
      if (thisIndex < currentIndex) {
        return { ...step, status: 'completed' as const };
      }
      return step;
    }));

    if (stepId === 'uploading' && current !== undefined && total !== undefined) {
      setUploadProgress({ current, total });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.modelName.trim()) {
      setError('Please select a model');
      return;
    }

    // Require either Drive link OR uploaded files
    const hasDriveLink = formData.driveLink && formData.driveLink.trim().length > 0;
    const hasUploadedFiles = formData.uploadedFiles && formData.uploadedFiles.length > 0;

    if (!hasDriveLink && !hasUploadedFiles) {
      setError('Please provide either a Google Drive link or upload photos');
      return;
    }

    // Validate Google Drive link format if provided
    if (hasDriveLink) {
      const drivePattern = /drive\.google\.com/;
      if (!drivePattern.test(formData.driveLink!)) {
        setError('Please provide a valid Google Drive link');
        return;
      }
    }

    // Reset progress
    setProgressSteps([
      { id: 'validating', label: 'Validating submission', status: 'pending' },
      { id: 'uploading', label: 'Uploading photos to S3', status: 'pending' },
      { id: 'creating', label: 'Creating task and photo records', status: 'pending' },
      { id: 'finalizing', label: 'Finalizing bulk submission', status: 'pending' },
    ]);
    setUploadProgress({ current: 0, total: 0 });

    setIsSubmitting(true);
    try {
      await onSubmit(formData, handleProgressUpdate);

      // Mark all steps as completed
      setProgressSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));

      // Reset form after a short delay to show completion
      setTimeout(() => {
        setFormData({
          modelName: '',
          driveLink: '',
          uploadedFiles: [],
          captions: [],
          columnStatus,
        });
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bulk submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const existingFiles = formData.uploadedFiles || [];
    const existingCaptions = formData.captions || [];

    // Append new files to existing ones
    const allFiles = [...existingFiles, ...fileArray];
    // Initialize captions for new files
    const newCaptions = [...existingCaptions, ...Array(fileArray.length).fill('')];

    setFormData({ ...formData, uploadedFiles: allFiles, captions: newCaptions });

    // Reset input so same file can be selected again
    e.target.value = '';
  }, [formData]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = [...(formData.uploadedFiles || [])];
    const newCaptions = [...(formData.captions || [])];

    newFiles.splice(index, 1);
    newCaptions.splice(index, 1);

    setFormData({ ...formData, uploadedFiles: newFiles, captions: newCaptions });
  }, [formData]);

  const handleCaptionChange = (index: number, caption: string) => {
    const newCaptions = [...(formData.captions || [])];
    newCaptions[index] = caption;
    setFormData({ ...formData, captions: newCaptions });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        modelName: '',
        driveLink: '',
        uploadedFiles: [],
        captions: [],
        columnStatus,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg">
              <ImagePlus className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Bulk Wall Post Submission
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Upload photos or paste Google Drive link
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          {/* <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Upload className="h-5 w-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-pink-900 dark:text-pink-100 mb-1">
                  How it works:
                </p>
                <ul className="list-disc list-inside space-y-1 text-pink-800 dark:text-pink-200">
                  <li>Select the model/creator</li>
                  <li>Upload photos directly OR paste Google Drive link</li>
                  <li>System creates one task with all photos</li>
                  <li>Each photo gets individual caption and status fields</li>
                  <li>Review and edit each photo individually</li>
                  <li>Move photos to "Ready to Post" when approved</li>
                </ul>
              </div>
            </div>
          </div> */}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Model/Creator <span className="text-red-500">*</span>
            </label>
            <ModelsDropdownList
              value={formData.modelName}
              onValueChange={(modelName) => setFormData({ ...formData, modelName })}
              placeholder="Choose a model..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select the model whose content you're uploading
            </p>
          </div>

          {/* Option 1: Photo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Option 1: Upload Photos Directly
            </label>

            {/* Show upload area only when no files or when adding more */}
            {(!formData.uploadedFiles || formData.uploadedFiles.length === 0) ? (
              <>
                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesSelected}
                    disabled={isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="text-center pointer-events-none">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Click to browse or drag and drop photos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Up to 50 photos (JPG, PNG, GIF, etc.)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Photos will only upload when you click "Create Bulk Posts"
                </p>
              </>
            ) : (
              <>
                {/* File preview with add more button */}
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {formData.uploadedFiles.length} {formData.uploadedFiles.length === 1 ? 'photo' : 'photos'} selected
                    </span>
                  </div>
                  <label className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                    <ImagePlus className="h-4 w-4" />
                    <span>Add More</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesSelected}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Photos will only upload when you click "Create Bulk Posts"
                </p>
              </>
            )}

            {/* Caption inputs for uploaded photos */}
            {formData.uploadedFiles && formData.uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Add Captions (Optional)
                  </h4>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formData.captions?.filter(c => c.trim()).length || 0} / {formData.uploadedFiles.length} with captions
                  </span>
                </div>
                {formData.uploadedFiles.map((file, index) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div key={index} className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start space-x-3">
                        {/* Image Preview */}
                        <div className="flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-700"
                            onLoad={() => URL.revokeObjectURL(imageUrl)}
                          />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {file.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              disabled={isSubmitting}
                              className="flex-shrink-0 ml-2 p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove photo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      {/* Caption Input */}
                      <textarea
                        value={formData.captions?.[index] || ''}
                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                        placeholder={`Enter caption for photo ${index + 1}... (optional)`}
                        rows={2}
                        disabled={isSubmitting}
                        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                          formData.captions?.[index]?.trim()
                            ? 'border-green-300 dark:border-green-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {formData.captions?.[index]?.trim() && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Caption added</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                OR
              </span>
            </div>
          </div>

          {/* Option 2: Drive Link */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Option 2: Google Drive Link
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={formData.driveLink || ''}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste the full Google Drive folder or file link containing the photos
            </p>
          </div>

          {/* Requirement Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Required:</span> You must provide either uploaded photos OR a Google Drive link (at least one)
            </p>
          </div>

          {/* Expected Output Preview */}
          {/* <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What happens next:
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <p>System processes photos from upload or Drive link</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <p>Creates one task card with all photos in "Pending Review"</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <p>Each photo has its own caption and status field</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <p>Review, edit captions, and update photo statuses individually</p>
              </div>
            </div>
          </div> */}
        </form>

        {/* Progress Indicator - Only show when submitting */}
        {isSubmitting && (
          <div className="px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border-t border-pink-200 dark:border-pink-800/50">
            <div className="space-y-3">
              {progressSteps.map((step) => (
                <div key={step.id} className="flex items-start space-x-3">
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'completed' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : step.status === 'in_progress' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        step.status === 'completed'
                          ? 'text-green-700 dark:text-green-400'
                          : step.status === 'in_progress'
                          ? 'text-pink-700 dark:text-pink-300'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.status === 'in_progress' && step.id === 'uploading' && uploadProgress.total > 0 && (
                        <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                          {uploadProgress.current} / {uploadProgress.total}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar for Upload Step */}
                    {step.status === 'in_progress' && step.id === 'uploading' && uploadProgress.total > 0 && (
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between p-6">
            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 flex-1 mr-4">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg shadow-pink-500/25"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? 'Creating Posts...' : 'Create Bulk Posts'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
