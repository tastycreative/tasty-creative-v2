"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, History, Edit3, Save, FileText, Image as ImageIcon, Check } from "lucide-react";
import { Task, BoardColumn } from "@/lib/stores/boardStore";
import { Session } from "next-auth";
import WallPostDetailSection from "./WallPostDetailSection";
import TaskComments from "./TaskComments";
import TaskCardHistory from "./TaskCardHistory";
import UserProfile from "@/components/ui/UserProfile";
import { formatForTaskDetail, formatDueDate } from "@/lib/dateUtils";

type TabType = 'description' | 'photos';

interface WallPostTaskModalProps {
  task: Task;
  isOpen: boolean;
  session: Session | null;
  columns?: BoardColumn[];
  onClose: () => void;
  onRefresh?: () => void;
}

export default function WallPostTaskModal({
  task,
  isOpen,
  session,
  columns = [],
  onClose,
  onRefresh,
}: WallPostTaskModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editedCaption, setEditedCaption] = useState<string>('');
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [localPhotos, setLocalPhotos] = useState(task.wallPostSubmission?.photos || []);

  if (!isOpen || !task.wallPostSubmission) return null;

  const photos = localPhotos;
  const selectedPhoto = photos[selectedPhotoIndex];

  // Get the column label for the current task status
  const getStatusLabel = (status: string) => {
    const column = columns.find(col => col.status === status);
    return column?.label || status.replace(/_/g, ' ');
  };

  // Sync local photos when task changes
  React.useEffect(() => {
    if (task.wallPostSubmission?.photos) {
      setLocalPhotos(task.wallPostSubmission.photos);
    }
  }, [task.wallPostSubmission?.photos]);

  // Initialize caption when photo changes
  React.useEffect(() => {
    if (selectedPhoto) {
      setEditedCaption(selectedPhoto.caption || '');
    }
  }, [selectedPhotoIndex, selectedPhoto?.id]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleStatusChange = async (photoId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state to reflect the change immediately
        setLocalPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId ? { ...photo, status: newStatus } : photo
          )
        );
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveCaption = async (photoId: string) => {
    setIsSavingCaption(true);
    try {
      const response = await fetch(`/api/wall-post-photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editedCaption }),
      });

      if (response.ok) {
        // Update local state to reflect the change immediately
        setLocalPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId ? { ...photo, caption: editedCaption } : photo
          )
        );
        setIsEditingPhotos(false);
      } else {
        alert('Failed to save caption');
      }
    } catch (error) {
      console.error('Error saving caption:', error);
      alert('Failed to save caption');
    } finally {
      setIsSavingCaption(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-[10000] overflow-y-auto">
      <div className="rounded-xl shadow-2xl w-full max-w-6xl border my-4 sm:my-8 overflow-hidden isolate backdrop-blur-none bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {task.title}
                </h3>
                {/* Task ID Badge */}
                {task.podTeam?.projectPrefix && task.taskNumber && (
                  <span className="font-mono bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2.5 py-1 rounded-md text-sm font-semibold border border-pink-200/50 dark:border-pink-700/50 flex-shrink-0">
                    {task.podTeam.projectPrefix}-{task.taskNumber}
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700 text-sm font-semibold shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                  <span>Wall Post Submission</span>
                </div>

                {task.priority && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                    task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <span className="text-xs">
                      {task.priority === 'URGENT' ? '🚨' :
                       task.priority === 'HIGH' ? '🔴' :
                       task.priority === 'MEDIUM' ? '🟡' :
                       '🟢'}
                    </span>
                    <span>{task.priority}</span>
                  </div>
                )}
              </div>

            
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showHistory
                    ? "text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-200/50 dark:hover:bg-purple-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* History Section (collapsible) */}
        {showHistory && task.podTeamId && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TaskCardHistory
              taskId={task.id}
              teamId={task.podTeamId}
              isModal={true}
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center px-4 sm:px-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Description</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Photos ({photos.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'description' ? (
          // Description Tab - Keep original sidebar layout
          <div className="flex flex-col lg:flex-row">
            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-8 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)]">
              <div className="space-y-8">
                {/* Photo Status Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Photo Status Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(() => {
                      const statusCounts = {
                        PENDING_REVIEW: { count: 0, label: 'Pending Review', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', dotColor: 'bg-gray-500' },
                        READY_TO_POST: { count: 0, label: 'Ready to Post', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dotColor: 'bg-blue-500' },
                        POSTED: { count: 0, label: 'Posted', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dotColor: 'bg-green-500' },
                        REJECTED: { count: 0, label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
                      };

                      photos.forEach(photo => {
                        if (statusCounts[photo.status as keyof typeof statusCounts]) {
                          statusCounts[photo.status as keyof typeof statusCounts].count++;
                        }
                      });

                      return Object.entries(statusCounts).map(([status, data]) => (
                        <div
                          key={status}
                          className={`p-4 rounded-lg border ${data.color.includes('gray') ? 'border-gray-200 dark:border-gray-700' : data.color.includes('blue') ? 'border-blue-200 dark:border-blue-800' : data.color.includes('green') ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-2 h-2 rounded-full ${data.dotColor}`}></div>
                            <span className="text-2xl font-bold">{data.count}</span>
                          </div>
                          <p className="text-xs font-medium opacity-80">{data.label}</p>
                          {photos.length > 0 && (
                            <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${data.dotColor}`}
                                style={{ width: `${(data.count / photos.length) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                      Description
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {task.description.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, index) => {
                          if (part.match(/^https?:\/\//)) {
                            return (
                              <a
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
                              >
                                {part}
                              </a>
                            );
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="min-w-0">
                  <TaskComments
                    taskId={task.id}
                    teamId={task.podTeamId || undefined}
                    currentUser={session?.user ? {
                      id: session.user.id!,
                      name: session.user.name,
                      email: session.user.email!,
                      image: session.user.image
                    } : null}
                    isViewOnly={false}
                  />
                </div>
              </div>
            </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 lg:max-w-80 lg:flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg min-w-0">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm flex-shrink-0">
                    {task.priority === "URGENT"
                      ? "🚨"
                      : task.priority === "HIGH"
                        ? "🔴"
                        : task.priority === "MEDIUM"
                          ? "🟡"
                          : "🟢"}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Assignee
                </label>
                {task.assignedUser ? (
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserProfile
                      user={task.assignedUser}
                      size="md"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.assignedUser.name ||
                          task.assignedUser.email
                            ?.split("@")[0]
                            .replace(/[._-]/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {task.assignedUser.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate">
                    Unassigned
                  </p>
                )}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Due Date
                  </label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className={`text-sm truncate ${formatDueDate(task.dueDate).className}`}>
                      {formatDueDate(task.dueDate).formatted}
                    </span>
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Created
                </label>
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {formatForTaskDetail(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 min-w-0">
                    <UserProfile
                      user={task.createdBy}
                      size="sm"
                      showTooltip
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {task.createdBy.name ||
                          task.createdBy.email
                            ?.split("@")[0]
                            .replace(/[._-]/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Last Updated
                </label>
                <div className="flex items-center space-x-2 min-w-0">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {formatForTaskDetail(task.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        ) : (
          // Photos Tab - YouTube-style layout
          <div className="flex flex-col lg:flex-row h-[calc(100vh-300px)]">
            {/* Left Section - Photo Viewer and Comments */}
            <div className="flex-1 flex flex-col">
              {/* Main Photo Viewer */}
              <div className="bg-black flex items-center justify-center p-4 sm:p-8" style={{ height: '60%' }}>
                {selectedPhoto && selectedPhoto.url ? (
                  <img
                    src={selectedPhoto.url}
                    alt={`Photo ${selectedPhotoIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No photo selected</p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] overflow-y-auto" style={{ height: '40%' }}>
                <div className="p-4">
                  <TaskComments
                    taskId={task.id}
                    teamId={task.podTeamId || undefined}
                    currentUser={session?.user ? {
                      id: session.user.id!,
                      name: session.user.name,
                      email: session.user.email!,
                      image: session.user.image
                    } : null}
                    isViewOnly={false}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar - Photo List (YouTube-style) */}
            <div className="w-full lg:w-96 lg:flex-shrink-0 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Photo Details Section */}
              {selectedPhoto && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="space-y-3">
                    {/* Photo Number and Status */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Photo {selectedPhotoIndex + 1} of {photos.length}
                      </h3>
                      <div className="relative">
                        <select
                          value={selectedPhoto.status}
                          onChange={(e) => handleStatusChange(selectedPhoto.id, e.target.value)}
                          disabled={isUpdatingStatus}
                          className={`text-xs px-2 py-1 rounded-full border bg-white dark:bg-gray-800 ${
                            isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="PENDING_REVIEW">Pending Review</option>
                          <option value="READY_TO_POST">Ready to Post</option>
                          <option value="POSTED">Posted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        {isUpdatingStatus && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-pink-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caption Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Caption
                        </label>
                        <button
                          onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={isEditingPhotos ? 'Done editing' : 'Edit caption'}
                        >
                          {isEditingPhotos ? (
                            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Edit3 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                      {isEditingPhotos ? (
                        <>
                          <textarea
                            value={editedCaption}
                            onChange={(e) => setEditedCaption(e.target.value)}
                            placeholder="Enter caption..."
                            rows={4}
                            disabled={isSavingCaption}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none ${
                              isSavingCaption ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          {editedCaption !== (selectedPhoto.caption || '') && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSaveCaption(selectedPhoto.id)}
                                disabled={isSavingCaption}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingCaption ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3 w-3" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setEditedCaption(selectedPhoto.caption || '')}
                                disabled={isSavingCaption}
                                className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </>
                      ) : selectedPhoto.caption ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedPhoto.caption}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-600 italic">No caption</p>
                      )}
                    </div>

                    {/* Photo Metadata */}
                    {selectedPhoto.postedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        <Check className="h-3 w-3 inline mr-1" />
                        Posted: {new Date(selectedPhoto.postedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Thumbnails List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-2">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`w-full flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                        selectedPhotoIndex === index
                          ? 'bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-500'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Photo {index + 1}
                          </span>
                          {selectedPhotoIndex === index && (
                            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {photo.caption || 'No caption'}
                        </p>
                        <div className="mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            photo.status === 'POSTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            photo.status === 'READY_TO_POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            photo.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {photo.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
