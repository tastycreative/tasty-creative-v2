"use client";

import React, { useState } from 'react';
import { Upload, ExternalLink, Trash2, Loader2, Image as ImageIcon, Plus, Check, X } from 'lucide-react';
import { Task } from '@/lib/stores/boardStore';

interface WallPostPhoto {
  id: string;
  s3Key: string;
  url: string | null;
  caption: string | null;
  status: string;
  position: number;
  createdAt: string;
  postedAt: string | null;
  publishedToGalleryAt: string | null;
}

interface WallPostDetailSectionProps {
  task: Task;
  isEditing: boolean;
  onRefresh: () => void;
}

const photoStatusConfig = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dotColor: 'bg-gray-500'
  },
  READY_TO_POST: {
    label: 'Ready to Post',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  POSTED: {
    label: 'Posted',
    color: 'bg-green-100 text-green-700 border-green-200',
    dotColor: 'bg-green-500'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500'
  },
};

export default function WallPostDetailSection({ task, isEditing, onRefresh }: WallPostDetailSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [editingCaptions, setEditingCaptions] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, string>>({});

  const wallPostSubmission = task.wallPostSubmission;

  if (!wallPostSubmission) return null;

  const photos = wallPostSubmission.photos || [];

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setIsUploading(true);
    try {
      // Upload photos to S3
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'wall_post'); // Organize wall post photos in dedicated folder

        const response = await fetch('/api/upload/s3', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.attachment;
      });

      const uploadedAttachments = await Promise.all(uploadPromises);

      // Create WallPostPhoto records for each uploaded image
      const createPhotoPromises = uploadedAttachments.map(async (attachment, index) => {
        const response = await fetch('/api/wall-post-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallPostSubmissionId: wallPostSubmission.id,
            s3Key: attachment.s3Key,
            position: photos.length + index,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create photo record');
        }

        return response.json();
      });

      await Promise.all(createPhotoPromises);

      // Refresh task data
      onRefresh();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle caption update
  const handleUpdateCaption = async (photoId: string) => {
    const caption = editingCaptions[photoId];
    if (caption === undefined) return;

    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });

      if (!response.ok) {
        throw new Error('Failed to update caption');
      }

      // Remove from editing state
      const newEditingCaptions = { ...editingCaptions };
      delete newEditingCaptions[photoId];
      setEditingCaptions(newEditingCaptions);

      onRefresh();
    } catch (error) {
      console.error('Error updating caption:', error);
      alert('Failed to update caption. Please try again.');
    }
  };

  // Handle status update
  const handleUpdateStatus = async (photoId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      onRefresh();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                Wall Post Bulk Submission
              </h3>
            </div>
            <p className="text-sm text-pink-800 dark:text-pink-200">
              Model: <span className="font-medium">{wallPostSubmission.modelName}</span>
            </p>
            {wallPostSubmission.driveLink && (
              <a
                href={wallPostSubmission.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-pink-100 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Google Drive</span>
              </a>
            )}
          </div>
          <div className="text-sm text-pink-700 dark:text-pink-300">
            <span className="font-semibold">{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </div>

      {/* Photo Upload Section (Phase 2) */}
      {isEditing && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3 mb-3">
            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Add Photos
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Upload additional photos to this wall post submission. Each photo can have its own caption and status.
              </p>
              <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-center pointer-events-none">
                  <Upload className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    Click to browse or drag and drop photos
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-500">
                    Up to 20 photos at once
                  </p>
                </div>
              </div>
            </div>
          </div>
          {isUploading && (
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 mt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading photos...</span>
            </div>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-1 font-medium">No photos yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Photos from the Google Drive link will appear here once processed, or you can upload them directly above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos
            .sort((a, b) => a.position - b.position)
            .map((photo) => {
              const config = photoStatusConfig[photo.status as keyof typeof photoStatusConfig] || photoStatusConfig.PENDING_REVIEW;
              const isEditingCaption = editingCaptions.hasOwnProperty(photo.id);

              return (
                <div
                  key={photo.id}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {/* Photo Preview */}
                    <div className="flex-shrink-0">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={`Photo ${photo.position + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Photo Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Status and Position */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Photo {photo.position + 1}
                          </span>
                          {isEditing ? (
                            <select
                              value={photo.status}
                              onChange={(e) => handleUpdateStatus(photo.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full border font-medium ${config.color}`}
                            >
                              <option value="PENDING_REVIEW">Pending Review</option>
                              <option value="READY_TO_POST">Ready to Post</option>
                              <option value="POSTED">Posted</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          ) : (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></div>
                              <span>{config.label}</span>
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Caption Editor */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Caption
                        </label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={isEditingCaption ? editingCaptions[photo.id] : (photo.caption || '')}
                              onChange={(e) => setEditingCaptions({ ...editingCaptions, [photo.id]: e.target.value })}
                              placeholder="Enter caption for this photo..."
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                            />
                            {isEditingCaption && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleUpdateCaption(photo.id)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const newEditingCaptions = { ...editingCaptions };
                                    delete newEditingCaptions[photo.id];
                                    setEditingCaptions(newEditingCaptions);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : photo.caption ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {photo.caption}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                            No caption yet
                          </p>
                        )}
                      </div>

                      {/* Metadata */}
                      {photo.postedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Posted: {new Date(photo.postedAt).toLocaleString()}
                        </p>
                      )}
                      {photo.publishedToGalleryAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Published to Gallery: {new Date(photo.publishedToGalleryAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
