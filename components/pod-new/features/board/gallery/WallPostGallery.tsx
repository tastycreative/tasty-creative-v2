"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session } from 'next-auth';
import { Image as ImageIcon, Filter, Download, Grid3X3, Search, ExternalLink, Calendar, User, CheckCircle2, Clock, XCircle, AlertCircle, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { toast } from 'sonner';
import { extractGoogleDriveFileId, isGoogleDriveUrl } from '@/lib/utils/googleDriveImageUrl';
import PermissionGoogle from '@/components/PermissionGoogle';
import WallPostTaskModal from '../WallPostTaskModal';
import type { Task, BoardColumn } from '@/lib/stores/boardStore';
import { signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Wrapper component for Google Drive images that shows permission UI inline
const GoogleDriveImage = ({
  src,
  alt,
  fill = false,
  className,
  sizes,
  loading,
  priority,
  onError,
  isModalView = false
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isModalView?: boolean;
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    onError?.(e);
  };

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/google-drive/list');
        if (response.ok) {
          setHasPermission(true);
          setError(false);
        } else {
          setHasPermission(false);
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermission();
  }, []);

  // For grid thumbnails, show a simple icon if no permission or image error
  if (!isModalView) {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      );
    }
    if (error || !hasPermission || imageError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="text-center">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-xs text-gray-500">{imageError ? 'No Access' : 'GDrive'}</span>
          </div>
        </div>
      );
    }
  }

  // Show error state for modal view if image failed to load
  if (isModalView && imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <p className="text-gray-400 text-sm">Image not accessible</p>
          <p className="text-gray-500 text-xs mt-1">You don't have permission to view this file</p>
        </div>
      </div>
    );
  }

  // For modal view or if permission is granted, show the full PermissionGoogle wrapper
  return (
    <>
      {hasPermission ? (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          className={className}
          sizes={sizes}
          loading={loading}
          priority={priority}
          unoptimized
          onError={handleImageError}
        />
      ) : (
        <PermissionGoogle apiEndpoint="/api/google-drive/list">
          <Image
            src={src}
            alt={alt}
            fill={fill}
            className={className}
            sizes={sizes}
            loading={loading}
            priority={priority}
            unoptimized
            onError={handleImageError}
          />
        </PermissionGoogle>
      )}
    </>
  );
};

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
  wallPostSubmission: {
    id: string;
    modelName: string;
    driveLink: string;
    task: {
      id: string;
      title: string;
      status: string;
      taskNumber: number;
      podTeam: {
        projectPrefix: string | null;
      } | null;
    };
  };
}

interface WallPostGalleryProps {
  teamId: string;
  teamName: string;
  session?: Session | null;
  columns?: BoardColumn[];
  selectedTask?: Task | null;
  onTaskSelect?: (task: Task) => void;
  onCloseTask?: () => void;
  onRefresh?: () => Promise<void>;
}

const photoStatusConfig = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dotColor: 'bg-gray-500',
    icon: Clock,
  },
  READY_TO_POST: {
    label: 'Ready to Post',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    icon: CheckCircle2,
  },
  POSTED: {
    label: 'Posted',
    color: 'bg-green-100 text-green-700 border-green-200',
    dotColor: 'bg-green-500',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    icon: XCircle,
  },
};

export default function WallPostGallery({
  teamId,
  teamName,
  session,
  columns = [],
  selectedTask,
  onTaskSelect,
  onCloseTask,
  onRefresh
}: WallPostGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<WallPostPhoto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [hasGooglePermission, setHasGooglePermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check Google Drive permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/google-drive/list');
        if (response.ok) {
          setHasGooglePermission(true);
          setIsSignedIn(true);
        } else if (response.status === 401) {
          // User not signed in
          setHasGooglePermission(false);
          setIsSignedIn(false);
        } else {
          // User signed in but no permission
          setHasGooglePermission(false);
          setIsSignedIn(true);
        }
      } catch {
        setHasGooglePermission(false);
        setIsSignedIn(false);
      } finally {
        setCheckingPermission(false);
      }
    };
    checkPermission();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all wall post photos with pagination and search
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['wall-post-photos', teamId, selectedModel, selectedStatus, debouncedSearchQuery, currentPage, itemsPerPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        teamId,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        ...(selectedModel !== 'all' && { modelName: selectedModel }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      });

      const response = await fetch(`/api/wall-post-photos/all?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      return response.json();
    },
  });

  const photos: WallPostPhoto[] = data?.photos || [];
  // Trim whitespace from model names and ensure uniqueness
  const modelNames: string[] = Array.from(
    new Set((data?.modelNames || []).map((name: string) => name.trim()).filter((name: string) => name))
  ).sort();
  const stats = data?.stats || { total: 0, pendingReview: 0, readyToPost: 0, posted: 0, rejected: 0 };
  const totalCount = data?.totalCount || 0;

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModel, selectedStatus, debouncedSearchQuery]);

  // Handle photo download
  const handleDownload = async (photo: WallPostPhoto) => {
    try {
      if (!photo.url) {
        toast.error('Photo URL not available');
        return;
      }

      const fileName = `${photo.wallPostSubmission.modelName}_${photo.position + 1}.jpg`;

      // Determine download URL based on source
      let downloadUrl: string;

      // Check if it's a Google Drive URL
      if (isGoogleDriveUrl(photo.url)) {
        const fileId = extractGoogleDriveFileId(photo.url);
        if (!fileId) {
          toast.error('Could not extract file ID from Google Drive URL');
          return;
        }
        // Use authenticated Google Drive API to download photos
        downloadUrl = `/api/google-drive/thumbnail?fileId=${fileId}&size=2000`;
      } else {
        // For S3 or other URLs, use the URL directly (it's already signed)
        downloadUrl = photo.url;
      }

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Photo downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download photo', {
        description: 'Opening in new tab instead',
      });

      // Fallback: Open in Google Drive
      if (photo.url) {
        const fileId = extractGoogleDriveFileId(photo.url);
        const driveUrl = fileId
          ? `https://drive.google.com/file/d/${fileId}/view`
          : photo.url;
        window.open(driveUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Navigate to task
  const handleGoToTask = (photo: WallPostPhoto) => {
    const task = photo.wallPostSubmission.task;
    const projectPrefix = task.podTeam?.projectPrefix;
    const taskNumber = task.taskNumber;

    if (projectPrefix && taskNumber) {
      const taskIdentifier = `${projectPrefix}-${taskNumber}`;
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('task', taskIdentifier);
      router.push(`?${currentParams.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
        {/* Header with Stats */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        </div>

        <div className="relative p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
              <Grid3X3 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                Wall Post Gallery
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Browse and manage all Wall Post photos</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`relative overflow-hidden bg-gradient-to-br from-pink-50 via-pink-50/30 to-purple-50/30 dark:from-pink-900/20 dark:via-pink-800/10 dark:to-purple-900/20 rounded-xl border p-4 hover:scale-105 transition-all duration-200 text-left ${
                selectedStatus === 'all'
                  ? 'border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/50 shadow-lg shadow-pink-500/25'
                  : 'border-pink-200/60 dark:border-pink-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 dark:text-pink-400">Total</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-pink-500 opacity-50" />
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus('PENDING_REVIEW')}
              className={`relative overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50/30 to-gray-100/30 dark:from-gray-800/20 dark:via-gray-700/10 dark:to-gray-900/20 rounded-xl border p-4 hover:scale-105 transition-all duration-200 text-left ${
                selectedStatus === 'PENDING_REVIEW'
                  ? 'border-gray-500 dark:border-gray-400 ring-2 ring-gray-500/50 shadow-lg shadow-gray-500/25'
                  : 'border-gray-200/60 dark:border-gray-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.pendingReview}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500 opacity-50" />
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus('READY_TO_POST')}
              className={`relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-50/30 to-blue-100/30 dark:from-blue-900/20 dark:via-blue-800/10 dark:to-blue-900/20 rounded-xl border p-4 hover:scale-105 transition-all duration-200 text-left ${
                selectedStatus === 'READY_TO_POST'
                  ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/25'
                  : 'border-blue-200/60 dark:border-blue-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Ready</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.readyToPost}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus('POSTED')}
              className={`relative overflow-hidden bg-gradient-to-br from-green-50 via-green-50/30 to-green-100/30 dark:from-green-900/20 dark:via-green-800/10 dark:to-green-900/20 rounded-xl border p-4 hover:scale-105 transition-all duration-200 text-left ${
                selectedStatus === 'POSTED'
                  ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500/50 shadow-lg shadow-green-500/25'
                  : 'border-green-200/60 dark:border-green-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">Posted</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.posted}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus('REJECTED')}
              className={`relative overflow-hidden bg-gradient-to-br from-red-50 via-red-50/30 to-red-100/30 dark:from-red-900/20 dark:via-red-800/10 dark:to-red-900/20 rounded-xl border p-4 hover:scale-105 transition-all duration-200 text-left ${
                selectedStatus === 'REJECTED'
                  ? 'border-red-500 dark:border-red-400 ring-2 ring-red-500/50 shadow-lg shadow-red-500/25'
                  : 'border-red-200/60 dark:border-red-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Rejected</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive Sign-In Banner */}
      {!checkingPermission && !hasGooglePermission && photos.some(photo => photo.url && isGoogleDriveUrl(photo.url)) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {isSignedIn
                ? "Some photos are from Google Drive. Grant access to view them."
                : "Some photos are from Google Drive. Sign in to view them."
              }
            </span>
          </div>
          <Button
            onClick={async () => {
              await signIn("google", {
                callbackUrl: pathname,
              }, {
                prompt: "consent",
                access_type: "offline",
                scope: "openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
              });
            }}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md flex-shrink-0"
          >
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isSignedIn ? "Grant Access" : "Sign in with Google"}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by model, caption, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl border-gray-200 dark:border-gray-700"
          />
          {(searchQuery !== debouncedSearchQuery || (isFetching && debouncedSearchQuery)) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isFetching}
            className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
          >
            <option value="all">All Models</option>
            {modelNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {isFetching && data && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={isFetching}
          className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
        >
          <option value="all">All Status</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="READY_TO_POST">Ready to Post</option>
          <option value="POSTED">Posted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Photo Grid */}
      {isFetching && !data ? (
        // Show skeleton loaders only on initial load (no data yet)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(itemsPerPage > 20 ? 20 : itemsPerPage)].map((_, i) => (
            <div key={i} className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Show error state
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Failed to load photos</h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">{(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline" className="border-red-300 dark:border-red-700">
            Try Again
          </Button>
        </div>
      ) : photos.length > 0 ? (
        <>
          <div className="relative">
            {/* Loading overlay when refetching */}
            {isFetching && data && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => {
            const statusConfig = photoStatusConfig[photo.status as keyof typeof photoStatusConfig] || photoStatusConfig.PENDING_REVIEW;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={photo.id}
                className="group relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Photo */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  {(() => {
                    // Determine image URL based on source type
                    let imageUrl: string | null = null;
                    let isGoogleDrive = false;

                    if (photo.url) {
                      // Check if it's a Google Drive URL
                      if (isGoogleDriveUrl(photo.url)) {
                        isGoogleDrive = true;
                        const fileId = extractGoogleDriveFileId(photo.url);
                        imageUrl = fileId ? `/api/google-drive/thumbnail?fileId=${fileId}&size=800` : null;
                      } else {
                        // For S3 or other URLs, use directly (they're already signed/public)
                        imageUrl = photo.url;
                      }
                    }

                    if (!imageUrl) {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                        </div>
                      );
                    }

                    // Use GoogleDriveImage for Google Drive URLs, regular Image for others
                    return isGoogleDrive ? (
                      <GoogleDriveImage
                        src={imageUrl}
                        alt={photo.caption || 'Wall post photo'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                        isModalView={false}
                        onError={(e) => {
                          // Fallback to a placeholder on error
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.errorHandled) {
                            target.dataset.errorHandled = 'true';
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700';
                              fallback.innerHTML = `<div class="text-center"><svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs text-gray-500 dark:text-gray-400">Image unavailable</span></div>`;
                              parent.appendChild(fallback);
                            }
                          }
                        }}
                      />
                    ) : (
                      <Image
                        src={imageUrl}
                        alt={photo.caption || 'Wall post photo'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                        unoptimized
                        onError={(e) => {
                          // Fallback to a placeholder on error
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.errorHandled) {
                            target.dataset.errorHandled = 'true';
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700';
                              fallback.innerHTML = `<div class="text-center"><svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs text-gray-500 dark:text-gray-400">Image unavailable</span></div>`;
                              parent.appendChild(fallback);
                            }
                          }
                        }}
                      />
                    );
                  })()}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-900 shadow-lg border-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold ${statusConfig.color} backdrop-blur-sm flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>

                  {/* Go to Task Button */}
                  {photo.wallPostSubmission.task.podTeam?.projectPrefix && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToTask(photo);
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-105 backdrop-blur-sm flex items-center gap-1"
                      title={`Open ${photo.wallPostSubmission.task.podTeam.projectPrefix}-${photo.wallPostSubmission.task.taskNumber}`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span className="text-xs font-semibold">
                        {photo.wallPostSubmission.task.podTeam.projectPrefix}-{photo.wallPostSubmission.task.taskNumber}
                      </span>
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {photo.wallPostSubmission.modelName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      #{photo.position + 1}
                    </span>
                  </div>

                  <p className="text-xs line-clamp-2 min-h-10">
                    {photo.caption ? (
                      <span className="text-gray-600 dark:text-gray-300">{photo.caption}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No caption</span>
                    )}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </div>
                    {photo.url && (
                      <a
                        href={(() => {
                          if (isGoogleDriveUrl(photo.url!)) {
                            const fileId = extractGoogleDriveFileId(photo.url!);
                            return fileId ? `https://drive.google.com/file/d/${fileId}/view` : photo.url!;
                          }
                          return photo.url!;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title={isGoogleDriveUrl(photo.url) ? "Open in Google Drive" : "Open in new tab"}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {photo.postedAt && (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Posted {new Date(photo.postedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg backdrop-blur-sm">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            </div>

            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{startIndex}</span> to{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{endIndex}</span> of{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> photos
                </div>

                {/* Page Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-9 px-3 rounded-xl border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-3 rounded-xl border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-9 w-9 rounded-xl ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3 rounded-xl border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3 rounded-xl border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </Button>
                </div>

                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
          <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No photos found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search filters' : 'Upload photos to get started'}
          </p>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Photo */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
                {(() => {
                  // Determine image URL based on source type
                  let imageUrl: string | null = null;
                  let isGoogleDrive = false;

                  if (selectedPhoto.url) {
                    // Check if it's a Google Drive URL
                    if (isGoogleDriveUrl(selectedPhoto.url)) {
                      isGoogleDrive = true;
                      const fileId = extractGoogleDriveFileId(selectedPhoto.url);
                      imageUrl = fileId ? `/api/google-drive/thumbnail?fileId=${fileId}&size=2000` : null;
                    } else {
                      // For S3 or other URLs, use directly (they're already signed/public)
                      imageUrl = selectedPhoto.url;
                    }
                  }

                  if (!imageUrl) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    );
                  }

                  // Use GoogleDriveImage for Google Drive URLs, regular Image for others
                  return isGoogleDrive ? (
                    <GoogleDriveImage
                      src={imageUrl}
                      alt={selectedPhoto.caption || 'Wall post photo'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      isModalView={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.errorHandled) {
                          target.dataset.errorHandled = 'true';
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'flex flex-col items-center justify-center h-full bg-gray-200 dark:bg-gray-700 p-8';
                            fallback.innerHTML = `<div class="text-center"><svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Image unavailable</p><p class="text-xs text-gray-500 dark:text-gray-400">Unable to load image.</p></div>`;
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={selectedPhoto.caption || 'Wall post photo'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.errorHandled) {
                          target.dataset.errorHandled = 'true';
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'flex flex-col items-center justify-center h-full bg-gray-200 dark:bg-gray-700 p-8';
                            fallback.innerHTML = `<div class="text-center"><svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Image unavailable</p><p class="text-xs text-gray-500 dark:text-gray-400">Unable to load image.</p></div>`;
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  );
                })()}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {selectedPhoto.wallPostSubmission.modelName}
                  </h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${photoStatusConfig[selectedPhoto.status as keyof typeof photoStatusConfig]?.color || photoStatusConfig.PENDING_REVIEW.color}`}>
                    {React.createElement(photoStatusConfig[selectedPhoto.status as keyof typeof photoStatusConfig]?.icon || Clock, { className: "w-4 h-4" })}
                    {photoStatusConfig[selectedPhoto.status as keyof typeof photoStatusConfig]?.label || 'Unknown'}
                  </div>
                </div>

                {selectedPhoto.caption && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Caption</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPhoto.caption}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Position</span>
                    <span className="font-semibold text-gray-900 dark:text-white">#{selectedPhoto.position + 1}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedPhoto.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {selectedPhoto.postedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Posted</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {new Date(selectedPhoto.postedAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Task</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedPhoto.wallPostSubmission.task.podTeam?.projectPrefix || 'WP'}-{selectedPhoto.wallPostSubmission.task.taskNumber}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleDownload(selectedPhoto)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  {selectedPhoto.url && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedPhoto.url) {
                          const fileId = extractGoogleDriveFileId(selectedPhoto.url);
                          const driveUrl = fileId
                            ? `https://drive.google.com/file/d/${fileId}/view`
                            : selectedPhoto.url;
                          window.open(driveUrl, '_blank');
                        }
                      }}
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {/* Wall Post Task Modal */}
      {selectedTask && session && onCloseTask && onRefresh && (
        <WallPostTaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          session={session}
          columns={columns}
          onClose={onCloseTask}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
