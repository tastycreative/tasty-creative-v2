"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Grid3x3, Image, Upload, Edit3, Trash2, Check, Clock, MessageSquare, FolderPlus, X as CloseIcon, FolderInput } from 'lucide-react';
import UploadModal from './UploadModal';

interface UploadedFile {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
}

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  scheduledDate: string | null;
  status: string;
  postType: string;
  position: number | null;
  createdAt: string;
  // Legacy fields for compatibility
  image?: string;
  date?: string;
  type?: string;
}

const InstagramStagingTool = () => {
  const [view, setView] = useState('grid'); // 'grid' or 'queue'
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [importedImages, setImportedImages] = useState<UploadedFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedImageForMove, setSelectedImageForMove] = useState<UploadedFile | null>(null);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [dragOverPostId, setDragOverPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    fetchPosts();
  }, [selectedFolder]);

  // Prevent body scroll when move modal is open
  useEffect(() => {
    if (selectedImageForMove) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImageForMove]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const url = selectedFolder 
        ? `/api/instagram-staging/files?folder=${encodeURIComponent(selectedFolder)}`
        : '/api/instagram-staging/files';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setImportedImages(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleUploadComplete = () => {
    fetchFiles();
  };

  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch('/api/instagram-staging/posts');
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleAddToQueue = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/instagram-staging/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          caption: '',
          status: 'DRAFT',
          postType: 'FEED',
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPosts();
        alert('Image added to feed preview!');
      } else {
        alert('Failed to add image: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      alert('Failed to add image to queue');
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<InstagramPost>) => {
    try {
      const response = await fetch('/api/instagram-staging/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: postId, ...updates }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPosts();
      } else {
        alert('Failed to update post: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/instagram-staging/posts?id=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPosts();
        setSelectedPost(null);
        alert('Post deleted successfully');
      } else {
        alert('Failed to delete post: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const getFileName = (key: string) => {
    const parts = key.split('/');
    return parts[parts.length - 1];
  };

  const getFolderFromKey = (key: string) => {
    const parts = key.split('/');
    if (parts.length > 3) {
      return parts[2]; // instagram-staging/userId/folder/file
    }
    return 'Root';
  };

  const handleCreateFolderInLibrary = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    try {
      const response = await fetch("/api/instagram-staging/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName: newFolderName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setFolders((prev) => [...prev, data.folderName]);
        setSelectedFolder(data.folderName);
        setNewFolderName("");
        setIsCreatingFolder(false);
        fetchFiles();
      } else {
        alert("Failed to create folder: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const handleMoveImage = async (imageKey: string) => {
    if (!targetMoveFolder && targetMoveFolder !== "") {
      alert("Please select a target folder");
      return;
    }

    setIsMoving(true);

    try {
      const response = await fetch("/api/instagram-staging/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          sourceKey: imageKey, 
          targetFolder: targetMoveFolder || null 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedImageForMove(null);
        setTargetMoveFolder("");
        fetchFiles();
      } else {
        alert("Failed to move file: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error moving file:", error);
      alert("Failed to move file");
    } finally {
      setIsMoving(false);
    }
  };

  const openMoveModal = (img: UploadedFile) => {
    setSelectedImageForMove(img);
    setTargetMoveFolder("");
  };

  const closeMoveModal = () => {
    setSelectedImageForMove(null);
    setTargetMoveFolder("");
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) {
      alert("Please select a folder to delete");
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete the folder "${selectedFolder}" and all its contents? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeletingFolder(true);

    try {
      const response = await fetch(
        `/api/instagram-staging/delete-folder?folder=${encodeURIComponent(selectedFolder)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Folder deleted successfully");
        setSelectedFolder(""); // Reset to all folders
        fetchFiles();
      } else {
        alert("Failed to delete folder: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder");
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return 'bg-green-500';
      case 'SCHEDULED': return 'bg-blue-500';
      case 'DRAFT': return 'bg-gray-400';
      case 'ARCHIVED': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return 'Published';
      case 'SCHEDULED': return 'Scheduled';
      case 'DRAFT': return 'Draft';
      case 'ARCHIVED': return 'Archived';
      default: return 'Draft';
    }
  };

  const getImageStatus = (imageUrl: string) => {
    const post = posts.find(p => p.imageUrl === imageUrl);
    return post || null;
  };

  const getFilteredImages = () => {
    if (statusFilter === "ALL") {
      return importedImages;
    }
    
    if (statusFilter === "NOT_ADDED") {
      return importedImages.filter(img => !getImageStatus(img.url));
    }
    
    return importedImages.filter(img => {
      const status = getImageStatus(img.url);
      return status && status.status === statusFilter;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight opacity to the dragged element
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedPostId(null);
    setDragOverPostId(null);
  };

  const handleDragOver = (e: React.DragEvent, postId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPostId && draggedPostId !== postId) {
      setDragOverPostId(postId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverPostId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPostId: string) => {
    e.preventDefault();
    setDragOverPostId(null);

    if (!draggedPostId || draggedPostId === targetPostId) {
      return;
    }

    // Find the posts
    const draggedPost = posts.find(p => p.id === draggedPostId);
    const targetPost = posts.find(p => p.id === targetPostId);

    if (!draggedPost || !targetPost) {
      return;
    }

    // Get their current positions (if they don't have position, use index)
    const draggedPosition = draggedPost.position ?? posts.findIndex(p => p.id === draggedPostId);
    const targetPosition = targetPost.position ?? posts.findIndex(p => p.id === targetPostId);

    // Create new array with swapped positions
    const newPosts = posts.map(post => {
      if (post.id === draggedPostId) {
        return { ...post, position: targetPosition };
      }
      if (post.id === targetPostId) {
        return { ...post, position: draggedPosition };
      }
      return post;
    });

    // Sort by position for proper display
    newPosts.sort((a, b) => {
      const posA = a.position ?? posts.findIndex(p => p.id === a.id);
      const posB = b.position ?? posts.findIndex(p => p.id === b.id);
      return posA - posB;
    });

    // Update local state immediately for smooth UX
    setPosts(newPosts);

    // Update positions in database - swap the position values
    try {
      await Promise.all([
        fetch('/api/instagram-staging/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: draggedPostId,
            position: targetPosition,
          }),
        }),
        fetch('/api/instagram-staging/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetPostId,
            position: draggedPosition,
          }),
        }),
      ]);

      // Refresh to get correct order from database
      fetchPosts();
    } catch (error) {
      console.error('Error updating post positions:', error);
      // Revert on error
      setPosts(posts);
      alert('Failed to update post order');
    }

    setDraggedPostId(null);
  };

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 rounded-3xl">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border-b border-gray-200/50 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-30"></div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Image className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Instagram Content Staging
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your Instagram content and schedule
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Upload size={18} />
                Upload
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                <Calendar size={18} />
                Export Schedule
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2 mt-6">
            <button 
              onClick={() => setView('grid')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                view === 'grid' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-white/10 hover:shadow-md'
              }`}
            >
              <Grid3x3 size={18} />
              Feed Preview
            </button>
            <button 
              onClick={() => setView('queue')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                view === 'queue' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-white/10 hover:shadow-md'
              }`}
            >
              <Calendar size={18} />
              Queue Timeline
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)] px-8 py-8 gap-6">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white/50 via-pink-50/20 to-purple-50/20 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border border-gray-200/50 dark:border-white/10 rounded-3xl p-6">
          {view === 'grid' ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Feed Preview</h2>
              <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 max-w-4xl mx-auto">
                {posts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <Grid3x3 className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-semibold">No posts yet</p>
                      <p className="text-sm mt-2">Upload your first post to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <div 
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, post.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, post.id)}
                      onClick={() => setSelectedPost(post)}
                      className={`relative aspect-square cursor-move group overflow-hidden bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl transition-all ${
                        dragOverPostId === post.id ? 'ring-4 ring-pink-500 scale-95' : ''
                      } ${
                        draggedPostId === post.id ? 'opacity-50' : ''
                      }`}
                    >
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
                      />
                      {post.postType === 'REEL' && (
                        <div className="absolute top-2 right-2 bg-black/70 rounded-2xl p-1.5">
                          <div className="w-4 h-4 border-2 border-white border-l-transparent rounded-full" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit3 className="text-white" size={24} />
                        </div>
                      </div>
                      <div className={`absolute top-2 left-2 ${getStatusColor(post.status)} text-white text-xs px-3 py-1.5 rounded-full pointer-events-none`}>
                        {getStatusText(post.status)}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Content Queue</h2>
              {posts.length === 0 ? (
                <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/50 dark:border-white/10 rounded-3xl p-16 text-center">
                  <div className="text-gray-400 dark:text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">No posts in queue</p>
                    <p className="text-sm mt-2">Upload and schedule your content</p>
                  </div>
                </div>
              ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/50 dark:border-white/10 rounded-3xl p-5 flex gap-4 cursor-pointer hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-500/50 transition-all"
                  >
                    <img 
                      src={post.imageUrl} 
                      alt="" 
                      className="w-24 h-24 object-cover rounded-2xl"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${getStatusColor(post.status)} text-white text-xs px-2 py-1 rounded-full`}>
                          {getStatusText(post.status)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={14} />
                          {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                        </span>
                        {post.postType === 'REEL' && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">Reel</span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                        {post.caption || <span className="text-gray-400 italic">No caption yet...</span>}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="p-2 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-xl transition-all hover:shadow-md">
                        <Edit3 size={18} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all hover:shadow-md">
                        <MessageSquare size={18} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Editor or Library */}
        <div className="w-96 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-y-auto h-full">
            {selectedPost ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Post</h3>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                >
                  ✕
                </button>
              </div>
              
              <img 
                src={selectedPost.imageUrl} 
                alt="" 
                className="w-full aspect-square object-cover rounded-2xl mb-6 border border-gray-200/50 dark:border-white/10"
              />
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Caption</label>
                  <textarea 
                    className="w-full border border-gray-300/50 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 dark:text-white rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    rows={6}
                    placeholder="Write your caption here..."
                    value={selectedPost.caption || ''}
                    onChange={(e) => {
                      const newCaption = e.target.value;
                      setSelectedPost({...selectedPost, caption: newCaption});
                      handleUpdatePost(selectedPost.id, { caption: newCaption });
                    }}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(selectedPost.caption || '').length} characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Scheduled Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300/50 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={selectedPost.scheduledDate ? selectedPost.scheduledDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const newDate = e.target.value || null;
                      setSelectedPost({...selectedPost, scheduledDate: newDate});
                      handleUpdatePost(selectedPost.id, { scheduledDate: newDate });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select 
                    className="w-full border border-gray-300/50 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={selectedPost.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setSelectedPost({...selectedPost, status: newStatus});
                      handleUpdatePost(selectedPost.id, { status: newStatus });
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Check size={18} />
                    Done
                  </button>
                  <button 
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="p-3 border border-red-300/50 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 hover:shadow-md transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Image Library</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Uploaded Images</span>
                    <button 
                      onClick={fetchFiles}
                      disabled={isLoadingFiles}
                      className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 px-3 py-1.5 bg-pink-50 dark:bg-pink-950/50 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-all disabled:opacity-50"
                    >
                      {isLoadingFiles ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {/* Filters Section */}
                  <div className="mb-4 space-y-3">
                    {/* Folder Filter */}
                    {isCreatingFolder ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Enter folder name"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300/50 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          onKeyPress={(e) => e.key === "Enter" && handleCreateFolderInLibrary()}
                        />
                        <button
                          onClick={handleCreateFolderInLibrary}
                          className="px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all text-xs font-semibold"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName("");
                          }}
                          className="px-3 py-2 border border-gray-300/50 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          value={selectedFolder}
                          onChange={(e) => setSelectedFolder(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300/50 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        >
                          <option value="">📁 All Folders</option>
                          {folders.map((folder) => (
                            <option key={folder} value={folder}>
                              📁 {folder}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setIsCreatingFolder(true)}
                          className="px-3 py-2 flex items-center gap-1.5 text-xs font-semibold border border-gray-300/50 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                          title="Create new folder"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                        {selectedFolder && (
                          <button
                            onClick={handleDeleteFolder}
                            disabled={isDeletingFolder}
                            className="px-3 py-2 flex items-center gap-1.5 text-xs font-semibold border border-red-300/50 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                            title="Delete folder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Status Filter - Pill Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "ALL"
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("NOT_ADDED")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "NOT_ADDED"
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Not Added
                      </button>
                      <button
                        onClick={() => setStatusFilter("DRAFT")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "DRAFT"
                            ? "bg-gray-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => setStatusFilter("SCHEDULED")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "SCHEDULED"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Scheduled
                      </button>
                      <button
                        onClick={() => setStatusFilter("PUBLISHED")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "PUBLISHED"
                            ? "bg-green-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Published
                      </button>
                      <button
                        onClick={() => setStatusFilter("ARCHIVED")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusFilter === "ARCHIVED"
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Archived
                      </button>
                    </div>
                  </div>

                  {isLoadingFiles ? (
                    <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading files...</p>
                    </div>
                  ) : getFilteredImages().length === 0 ? (
                    <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <Image className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === "ALL" ? "No images uploaded" : "No images match this filter"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {statusFilter === "ALL" ? "Upload images to add to queue" : "Try a different filter"}
                      </p>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {getFilteredImages().map((img) => {
                      const isVideo = img.key.match(/\.(mp4|mov|avi|webm)$/i);
                      const imageStatus = getImageStatus(img.url);
                      return (
                      <div key={img.key} className="relative group">
                        <div className="cursor-pointer">
                          {isVideo ? (
                            <video 
                              src={img.url} 
                              className="w-full aspect-square object-cover rounded-2xl border border-gray-200/50 dark:border-white/10"
                            />
                          ) : (
                            <img 
                              src={img.url} 
                              alt="" 
                              className="w-full aspect-square object-cover rounded-2xl border border-gray-200/50 dark:border-white/10"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors rounded-2xl flex flex-col items-center justify-center gap-2 p-2">
                            <button 
                              onClick={() => openMoveModal(img)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg hover:bg-blue-600 flex items-center gap-1.5 w-full justify-center"
                            >
                              <FolderInput className="w-4 h-4" />
                              Move to Folder
                            </button>
                            <button 
                              onClick={() => handleAddToQueue(img.url)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg hover:shadow-xl w-full"
                            >
                              {imageStatus ? 'View in Queue' : 'Add to Queue'}
                            </button>
                          </div>
                          
                          {/* Folder Badge */}
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-xl">
                            {getFolderFromKey(img.key)}
                          </div>
                          
                          {/* Status Indicator Circle */}
                          {imageStatus && (
                            <div 
                              className={`absolute top-2 right-2 w-3 h-3 ${getStatusColor(imageStatus.status)} rounded-full shadow-lg border-2 border-white`}
                              title={getStatusText(imageStatus.status)}
                            ></div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Move File Modal */}
      {selectedImageForMove && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FolderInput className="w-6 h-6 text-blue-500" />
                    Move to Folder
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select a destination folder
                  </p>
                </div>
                <button
                  onClick={closeMoveModal}
                  disabled={isMoving}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-white/10">
                {selectedImageForMove.key.match(/\.(mp4|mov|avi|webm)$/i) ? (
                  <video 
                    src={selectedImageForMove.url} 
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200/50 dark:border-white/10"
                  />
                ) : (
                  <img 
                    src={selectedImageForMove.url} 
                    alt="" 
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200/50 dark:border-white/10"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {getFileName(selectedImageForMove.key)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current folder: <span className="font-medium">{getFolderFromKey(selectedImageForMove.key)}</span>
                  </p>
                </div>
              </div>

              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Destination Folder
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Root Folder Option */}
                  <button
                    onClick={() => setTargetMoveFolder("")}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      targetMoveFolder === ""
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200/50 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 bg-white/50 dark:bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        targetMoveFolder === ""
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}>
                        <FolderInput className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${
                          targetMoveFolder === ""
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}>
                          Root Folder
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No folder organization
                        </div>
                      </div>
                      {targetMoveFolder === "" && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Other Folders */}
                  {folders.filter(f => f !== getFolderFromKey(selectedImageForMove.key)).map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setTargetMoveFolder(folder)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        targetMoveFolder === folder
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200/50 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 bg-white/50 dark:bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          targetMoveFolder === folder
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}>
                          <FolderInput className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate ${
                            targetMoveFolder === folder
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {folder}
                          </div>
                        </div>
                        {targetMoveFolder === folder && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200/50 dark:border-white/10">
              <button
                onClick={closeMoveModal}
                disabled={isMoving}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300/50 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMoveImage(selectedImageForMove.key)}
                disabled={isMoving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {isMoving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Moving...
                  </>
                ) : (
                  <>
                    <FolderInput className="w-4 h-4" />
                    Move File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default InstagramStagingTool;
