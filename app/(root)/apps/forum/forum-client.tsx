"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Users,
  Star,
  Award,
  Pin,
  X,
  Send,
  Image as ImageIcon,
  Link,
  Bold,
  Italic,
  ChevronDown,
  Search,
  RefreshCw,
  Database,
} from "lucide-react";

// Import the forum hooks and API
import { 
  useForumPosts, 
  useForumCategories, 
  useForumStats, 
  useForumActions, 
  useVoteManager 
} from "../../../../hooks/useForum";
import { FrontendForumPost } from "../../../../lib/forum-api";
import { UsernameSetupModal } from "../../../../components/UsernameSetupModal";

interface ModelOption {
  name: string;
  id?: string;
}

interface User {
  id: string;
  username: string | null;
  email: string;
  name: string | null;
  hasUsername: boolean;
}

interface ForumPageClientProps {
  user: User;
  models: ModelOption[];
}

export default function ForumPageClient({ user, models }: ForumPageClientProps) {
  // State management
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModel, setSelectedModel] = useState<string>("General");
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FrontendForumPost | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Form states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General Discussion");
  const [newComment, setNewComment] = useState("");

  // Username state
  const [userState, setUserState] = useState(user);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Auto-show username modal if user doesn't have username
  useEffect(() => {
    if (!userState.hasUsername) {
      setShowUsernameModal(true);
    }
  }, [userState.hasUsername]);

  // API hooks
  const { 
    categories, 
    loading: categoriesLoading 
  } = useForumCategories();

  // Memoize the posts options to prevent infinite re-renders
  const postsOptions = useMemo(() => ({
    categoryId: selectedCategory === "All" ? undefined : categories.find(c => c.name === selectedCategory)?.id,
    modelName: selectedModel === "General" ? undefined : selectedModel,
    sortBy,
    page: currentPage,
    limit: 20,
    search: searchQuery || undefined,
  }), [selectedCategory, categories, selectedModel, sortBy, currentPage, searchQuery]);

  const { 
    posts, 
    loading: postsLoading, 
    error: postsError, 
    refetch: refetchPosts 
  } = useForumPosts(postsOptions);

  const { 
    stats, 
    loading: statsLoading 
  } = useForumStats();

  const { 
    createPost, 
    createComment, 
    seedForumData,
    loading: actionLoading,
    error: actionError 
  } = useForumActions();

  const { userVotes, handleVote } = useVoteManager();

  // Username management functions
  const setUsername = async (username: string): Promise<boolean> => {
    try {
      setUsernameLoading(true);
      setUsernameError(null);

      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set username');
      }

      const data = await response.json();
      setUserState({
        ...data.user,
        hasUsername: true
      });
      
      // Also update Prisma database
      await fetch('/api/user/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      return true;
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error setting username:', err);
      return false;
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handle post creation
  const handleCreatePost = async () => {
    // Check if user has username first
    if (!userState.hasUsername) {
      setShowUsernameModal(true);
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const categoryId = categories.find(c => c.name === newPostCategory)?.id;
    if (!categoryId) return;

    const postData = {
      title: newPostTitle,
      content: newPostContent,
      categoryId,
      modelName: selectedModel !== "General" ? selectedModel : undefined,
    };

    const newPost = await createPost(postData);
    if (newPost) {
      setNewPostTitle("");
      setNewPostContent("");
      setShowCreateModal(false);
      refetchPosts(); // Refresh the posts list
    }
  };

  // Handle username creation
  const handleUsernameSubmit = async (username: string): Promise<boolean> => {
    const success = await setUsername(username);
    if (success) {
      setShowUsernameModal(false);
      // After creating username, allow them to proceed with post creation
      if (showCreateModal) {
        // They were trying to create a post, so continue with that
        handleCreatePost();
      }
    }
    return success;
  };

  // Check username before allowing forum actions
  const checkUsernameBeforeAction = (action: () => void) => {
    if (!userState.hasUsername) {
      setShowUsernameModal(true);
      return;
    }
    action();
  };

  // Handle voting
  const onVote = async (postId: string, voteType: "up" | "down") => {
    if (!userState.hasUsername) {
      setShowUsernameModal(true);
      return;
    }
    
    const numericId = parseInt(postId);
    await handleVote(postId, voteType, "post", numericId);
  };

  // Handle comment creation
  const handleAddComment = async () => {
    if (!userState.hasUsername) {
      setShowUsernameModal(true);
      return;
    }

    if (!newComment.trim() || !selectedPost) return;

    const commentData = {
      content: newComment,
      postId: parseInt(selectedPost.id),
    };

    const comment = await createComment(commentData);
    if (comment) {
      // Update the selected post with the new comment
      setSelectedPost(prev => 
        prev ? { 
          ...prev, 
          comments: [...prev.comments, comment] 
        } : null
      );
      setNewComment("");
      refetchPosts(); // Refresh to get updated comment counts
    }
  };

  // Handle seeding data
  const handleSeedData = async () => {
    const success = await seedForumData();
    if (success) {
      refetchPosts();
    }
  };

  const openCommentsModal = (post: FrontendForumPost) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.name === category);
    return cat?.color || "gray";
  };

  if (categoriesLoading || statsLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600 dark:text-gray-300">Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Community Forum
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Connect, discuss, and share with the community
              </p>
              {/* Username Status */}
              {userState.hasUsername ? (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ✓ Logged in as {userState.username}
                </p>
              ) : (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  ⚠ Please create a username to participate in the forum
                </p>
              )}
            </div>
            {/* Admin Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleSeedData}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                Seed Data
              </button>
              <button
                onClick={refetchPosts}
                disabled={postsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error Display */}
          {(postsError || actionError) && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400">
                {postsError || actionError}
              </p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
            >
              <span className="font-medium">
                {selectedModel === "General"
                  ? "🌍 General Forum"
                  : `🤖 ${selectedModel} Forum`}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-100/95 dark:bg-gray-800/95 border border-gray-200 dark:border-white/20 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto backdrop-blur-sm">
                {models.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setShowModelDropdown(false);
                      setCurrentPage(1); // Reset to first page
                    }}
                    className={`w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedModel === model.name
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                        : ""
                    }`}
                  >
                    {model.name === "General"
                      ? "🌍 General Forum"
                      : `🤖 ${model.name} Forum`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page
              }}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Create Post Button */}
          <button
            onClick={() => checkUsernameBeforeAction(() => setShowCreateModal(true))}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
          >
            Create Post
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Stats */}
            <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Community Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      Active Users
                    </span>
                  </div>
                  <span className="text-gray-800 dark:text-white font-bold">
                    {stats?.activeUsers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      Total Posts
                    </span>
                  </div>
                  <span className="text-gray-800 dark:text-white font-bold">
                    {stats?.totalPosts || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      Today
                    </span>
                  </div>
                  <span className="text-gray-800 dark:text-white font-bold">
                    {stats?.todayPosts || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === "All"
                      ? "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                      : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === category.name
                        ? category.color === "gray"
                          ? "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                          : category.color === "green"
                            ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                            : category.color === "blue"
                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : category.color === "purple"
                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                : category.color === "red"
                                  ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                  : category.color === "orange"
                                    ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Sort By
              </h3>
              <div className="space-y-2">
                {[
                  { id: "hot", label: "Hot", icon: TrendingUp },
                  { id: "new", label: "New", icon: Clock },
                  { id: "top", label: "Top", icon: Star },
                ].map((sort) => {
                  const Icon = sort.icon;
                  return (
                    <button
                      key={sort.id}
                      onClick={() => {
                        setSortBy(sort.id as "hot" | "new" | "top");
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        sortBy === sort.id
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {sort.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3">
            {/* Forum Context */}
            {selectedModel !== "General" && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  🤖 {selectedModel} Forum
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Discussions specific to {selectedModel}. Share tips,
                  experiences, and connect with other {selectedModel} users.
                </p>
              </div>
            )}

            {/* Loading State */}
            {postsLoading && (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                <p className="text-gray-600 dark:text-gray-300">Loading posts...</p>
              </div>
            )}

            {/* Posts */}
            {!postsLoading && (
              <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedModel !== "General"
                        ? `Be the first to start a discussion in the ${selectedModel} forum!`
                        : "Be the first to start a discussion!"}
                    </p>
                    <button
                      onClick={() => checkUsernameBeforeAction(() => setShowCreateModal(true))}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      Create First Post
                    </button>
                  </div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all"
                    >
                      <div className="p-6">
                        <div className="flex gap-4">
                          {/* Vote section */}
                          <div className="flex flex-col items-center gap-1 min-w-[40px]">
                            <button
                              onClick={() => onVote(post.id, "up")}
                              className={`p-2 rounded-full transition-all ${
                                userVotes[post.id] === "up"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                              }`}
                            >
                              <ArrowUp className="w-5 h-5" />
                            </button>
                            <span className="text-lg font-bold text-gray-800 dark:text-white">
                              {post.upvotes - post.downvotes}
                            </span>
                            <button
                              onClick={() => onVote(post.id, "down")}
                              className={`p-2 rounded-full transition-all ${
                                userVotes[post.id] === "down"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                              }`}
                            >
                              <ArrowDown className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                              {post.isPinned && (
                                <Pin className="w-4 h-4 text-green-400" />
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  getCategoryColor(post.category) === "green"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : getCategoryColor(post.category) === "blue"
                                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                      : getCategoryColor(post.category) ===
                                          "purple"
                                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                        : getCategoryColor(post.category) ===
                                            "red"
                                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                          : getCategoryColor(post.category) ===
                                              "orange"
                                            ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                            : getCategoryColor(post.category) ===
                                                "emerald"
                                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                              : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {post.category}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 text-sm">
                                •
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 text-sm">
                                {post.timestamp}
                              </span>
                              {post.awards && post.awards > 0 && (
                                <>
                                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                                    •
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Award className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs text-yellow-400">
                                      {post.awards}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Title */}
                            <h3
                              onClick={() => openCommentsModal(post)}
                              className="text-xl font-semibold text-gray-800 dark:text-white mb-3 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors"
                            >
                              {post.title}
                            </h3>

                            {/* Content preview */}
                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                              {post.content}
                            </p>

                            {/* Author and actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {post.avatar}
                                  </span>
                                </div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  u/{post.author}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => openCommentsModal(post)}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-sm">
                                    {post.comments.length}
                                  </span>
                                </button>
                                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                                  <Share className="w-4 h-4" />
                                </button>
                                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                                  <Bookmark className="w-4 h-4" />
                                </button>
                                <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCreateModal(false);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-100/95 dark:bg-gray-900/95 rounded-xl border border-gray-200 dark:border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Create New Post{" "}
                    {selectedModel !== "General" && `in ${selectedModel} Forum`}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.name}
                          className="bg-gray-100 dark:bg-gray-800"
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Enter your post title..."
                      className="w-full px-3 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                      {/* Formatting toolbar */}
                      <div className="bg-gray-100/80 dark:bg-white/5 px-3 py-2 border-b border-gray-200 dark:border-white/10 flex items-center gap-2">
                        <button className="p-1 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10">
                          <Bold className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10">
                          <Italic className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10">
                          <Link className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share your thoughts, tips, or questions..."
                        rows={6}
                        className="w-full px-3 py-2 bg-transparent text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostTitle.trim() || !newPostContent.trim() || actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Creating..." : "Post"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Comments Modal */}
        <AnimatePresence>
          {showCommentsModal && selectedPost && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCommentsModal(false);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-100/95 dark:bg-gray-900/95 rounded-xl border border-gray-200 dark:border-white/20 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Comments
                  </h3>
                  <button
                    onClick={() => setShowCommentsModal(false)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Original Post */}
                <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {selectedPost.avatar}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      u/{selectedPost.author}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      •
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {selectedPost.timestamp}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {selectedPost.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedPost.content}
                  </p>
                </div>

                {/* Add Comment */}
                <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {userState.username ? userState.username.substring(0, 2).toUpperCase() : "CU"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || actionLoading}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {actionLoading ? "Adding..." : "Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {selectedPost.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {comment.author.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          u/{comment.author}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          •
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-white text-sm">
                        {comment.content}
                      </p>
                    </div>
                  ))}

                  {selectedPost.comments.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <UsernameSetupModal
          isOpen={showUsernameModal}
          onClose={() => {
            // Only allow closing if user has username
            if (userState.hasUsername) {
              setShowUsernameModal(false);
            }
          }}
          onSubmit={handleUsernameSubmit}
          loading={usernameLoading}
          error={usernameError}
        />
      </div>
    </div>
  );
}
