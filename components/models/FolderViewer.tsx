"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Download,
  Play,
  Image as ImageIcon,
  File,
  Folder,
  Clock,
  HardDrive
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string | null;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  } | null;
  createdTime: string;
  size?: string | null;
}

interface FolderViewerProps {
  folderId: string;
  folderName: string;
  onBack: () => void;
}

const FolderViewer: React.FC<FolderViewerProps> = ({ folderId, folderName, onBack }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolderContents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching contents for folder: ${folderId}`);
        const response = await fetch(`/api/drive-folder?folderId=${encodeURIComponent(folderId)}`);
        
        console.log(`API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`API error: ${response.status} - ${errorData}`);
          throw new Error('Failed to fetch folder contents');
        }
        
        const data = await response.json();
        console.log(`Folder contents received:`, {
          filesCount: data.files?.length || 0,
          files: data.files?.slice(0, 3) // Log first 3 files for debugging
        });
        setFiles(data.files || []);
      } catch (err) {
        console.error('Error fetching folder contents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load folder');
      } finally {
        setLoading(false);
      }
    };

    fetchFolderContents();
  }, [folderId]);

  const formatFileSize = (bytes: string | null | undefined): string => {
    if (!bytes) return 'Unknown';
    const size = parseInt(bytes);
    if (isNaN(size)) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDuration = (durationMillis?: string): string => {
    if (!durationMillis) return '';
    const seconds = Math.floor(parseInt(durationMillis) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return Play;
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.includes('folder')) return Folder;
    return File;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return 'text-blue-400';
    if (mimeType.startsWith('image/')) return 'text-green-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-semibold text-white">{folderName}</h2>
        </div>
        
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading folder contents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-semibold text-white">{folderName}</h2>
        </div>
        
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <File className="w-5 h-5" />
            <span>Error loading folder: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-white">{folderName}</h2>
          <p className="text-gray-400 text-sm">{files.length} items</p>
        </div>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Empty folder</h3>
          <p className="text-gray-400">This folder doesn't contain any files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            const iconColor = getFileTypeColor(file.mimeType);
            
            return (
              <div
                key={file.id}
                className="group bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-700/30 relative overflow-hidden">
                  {file.thumbnailLink ? (
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(file.thumbnailLink)}`}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className={`w-12 h-12 ${iconColor}`} />
                    </div>
                  )}
                  
                  {/* Duration overlay for videos */}
                  {file.videoMediaMetadata?.durationMillis && (
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                      <span className="text-white text-xs font-medium">
                        {formatDuration(file.videoMediaMetadata.durationMillis)}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                    {file.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      View
                    </a>
                    <a
                      href={`https://drive.google.com/uc?export=download&id=${file.id}`}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-xs transition-colors flex items-center justify-center"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderViewer;
