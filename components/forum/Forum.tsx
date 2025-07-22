"use client";

import { useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { 
  useForumPosts, 
  useForumCategories, 
  useForumStats, 
  useForumActions, 
  useVoteManager 
} from "../../hooks/useForum";
import { useUsername } from "../../hooks/useUsername";
import { FrontendForumPost } from "../../lib/forum-api";
import { UsernameSetupModal } from "../UsernameSetupModal";

// Import forum components
import { ForumStats } from "./ForumStats";
import { ForumCategories } from "./ForumCategories";
import { ForumSortOptions } from "./ForumSortOptions";
import { ForumControls } from "./ForumControls";
import { ForumPostsList } from "./ForumPostsList";
import { CreatePostModal, ForumType } from "./CreatePostModal";
import { CommentsModal } from "./CommentsModal";

interface ModelOption {
  name: string;
  id?: string;
}

interface ForumProps {
  forum: ForumType;
  models?: ModelOption[];
  title?: string;
  subtitle?: string;
  showModelSelector?: boolean;
  showSidebar?: boolean;
  allowModelSwitching?: boolean;
}

export function Forum({
  forum,
  models = [{ name: "General" }],
  title = "Community Forum",
  subtitle = "Connect, discuss, and share with the community",
  showModelSelector = true,
  showSidebar = true,
  allowModelSwitching = true,
}: ForumProps) {
  // Username management
  const { 
    user: currentUser, 
    loading: usernameLoading, 
    error: usernameError, 
    hasUsername, 
    setUsername 
  } = useUsername();

  // State management
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModel, setSelectedModel] = useState<string>(
    forum.type === "model" ? forum.name || "General" : "All Forums"
  );
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FrontendForumPost | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Auto-show username modal if user doesn't have username
  useEffect(() => {
    if (!usernameLoading && !hasUsername) {
      setShowUsernameModal(true);
    }
  }, [usernameLoading, hasUsername]);

  // Update selected model when forum prop changes
  useEffect(() => {
    if (forum.type === "model" && forum.name) {
      setSelectedModel(forum.name);
    } else if (forum.type === "general") {
      setSelectedModel("All Forums"); // Start with All Forums as default for general forum pages
    }
    console.log('Forum prop changed:', forum, 'selectedModel will be set to:', forum.type === "model" ? forum.name : "All Forums");
  }, [forum]);

  // API hooks
  const { 
    categories, 
    loading: categoriesLoading 
  } = useForumCategories();

  // Memoize the posts options to prevent infinite re-renders
  const postsOptions = useMemo(() => {
    const isGeneralForum = selectedModel === "General";
    const isAllForums = selectedModel === "All Forums";
    
    // For general forum type, we want to show only general posts (no model assigned)
    // unless the user explicitly selects "All Forums"
    const showGeneralOnly = forum.type === "general" && !isAllForums;
    
    const options = {
      categoryId: selectedCategory === "All" ? undefined : categories.find(c => c.name === selectedCategory)?.id,
      modelName: allowModelSwitching && !isGeneralForum && !isAllForums ? selectedModel : 
                 forum.type === "model" ? forum.name : undefined,
      generalOnly: isGeneralForum || showGeneralOnly, // Show general posts when "General" is selected OR when in general forum type
      sortBy,
      page: currentPage,
      limit: 20,
      search: searchQuery || undefined,
    };
    
    console.log('Posts options:', {
      selectedModel,
      isGeneralForum,
      isAllForums,
      showGeneralOnly,
      forumType: forum.type,
      options
    });
    
    return options;
  }, [selectedCategory, categories, selectedModel, allowModelSwitching, forum, sortBy, currentPage, searchQuery]);

  const { 
    posts, 
    loading: postsLoading, 
    error: postsError, 
    refetch: refetchPosts 
  } = useForumPosts(postsOptions);

  const { 
    stats, 
    loading: statsLoading,
    refetch: refetchStats 
  } = useForumStats();

  const { 
    createPost, 
    createComment,
    loading: actionLoading,
    error: actionError 
  } = useForumActions();

  const { userVotes, handleVote, getDisplayScores } = useVoteManager();

  // Handle post creation
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    categoryId: number;
    modelName?: string;
  }) => {
    // Check if user has username first
    if (!hasUsername) {
      setShowUsernameModal(true);
      return;
    }

    const newPost = await createPost(postData);
    if (newPost) {
      setShowCreateModal(false);
      refetchPosts();
      refetchStats();
    }
  };

  // Handle username creation
  const handleUsernameSubmit = async (username: string): Promise<boolean> => {
    const success = await setUsername(username);
    if (success) {
      setShowUsernameModal(false);
    }
    return success;
  };

  // Check username before allowing forum actions
  const checkUsernameBeforeAction = (action: () => void) => {
    if (!hasUsername) {
      setShowUsernameModal(true);
      return;
    }
    action();
  };

  // Handle voting
  const onVote = async (post: FrontendForumPost, voteType: "up" | "down") => {
    if (!hasUsername) {
      setShowUsernameModal(true);
      return;
    }
    
    const numericId = parseInt(post.id);
    await handleVote(post.id, voteType, "post", numericId, post.upvotes, post.downvotes);
  };

  // Handle comment creation
  const handleAddComment = async (content: string) => {
    if (!hasUsername || !selectedPost) return;

    const commentData = {
      content,
      postId: parseInt(selectedPost.id),
    };

    const comment = await createComment(commentData);
    if (comment) {
      setSelectedPost(prev => 
        prev ? { 
          ...prev, 
          comments: [...prev.comments, comment] 
        } : null
      );
      refetchPosts();
      refetchStats();
      return comment;
    }
  };

  const openCommentsModal = (post: FrontendForumPost) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleModelChange = (model: string) => {
    if (allowModelSwitching) {
      setSelectedModel(model);
      setCurrentPage(1);
      setShowModelDropdown(false);
    }
  };

  const handleSortChange = (sort: "hot" | "new" | "top") => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
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

  const getCurrentForum = (): ForumType => {
    if (allowModelSwitching) {
      return selectedModel === "General" 
        ? { type: "general" } 
        : selectedModel === "All Forums"
          ? { type: "general", name: "All Forums" } // Include name for All Forums
          : { type: "model", name: selectedModel };
    }
    return forum;
  };

  const getEmptyStateMessage = () => {
    const currentForum = getCurrentForum();
    if (currentForum.type === "model") {
      return `Be the first to start a discussion in the ${currentForum.name} forum!`;
    }
    return "Be the first to start a discussion!";
  };

  if (categoriesLoading || statsLoading || usernameLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-500" />
          <p className="text-gray-600">Loading forum...</p>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              <p className="text-gray-600 text-lg">
                {subtitle}
              </p>
              {/* Username Status */}
              {hasUsername && currentUser ? (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Logged in as {currentUser.username}
                </p>
              ) : (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠ Please create a username to participate in the forum
                </p>
              )}
            </div>
            {/* Admin Controls */}
            <div className="flex gap-2">
              <button
                onClick={refetchPosts}
                disabled={postsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error Display */}
          {(postsError || actionError || usernameError) && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700">
                {postsError || actionError || usernameError}
              </p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <ForumControls
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          showModelDropdown={showModelDropdown}
          onToggleModelDropdown={() => setShowModelDropdown(!showModelDropdown)}
          models={models}
          onCreatePost={() => checkUsernameBeforeAction(() => setShowCreateModal(true))}
          showModelSelector={showModelSelector && allowModelSwitching}
        />

        <div className={`grid grid-cols-1 ${showSidebar ? 'xl:grid-cols-4' : ''} gap-6`}>
          {/* Sidebar */}
          {showSidebar && (
            <div className="xl:col-span-1 space-y-6">
              <ForumStats stats={stats} loading={statsLoading} />
              <ForumCategories 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
              />
              <ForumSortOptions 
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={showSidebar ? "xl:col-span-3" : "col-span-1"}>
            {/* Forum Context */}
            {getCurrentForum().type === "model" && (
              <div className="bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-300 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  👤 {getCurrentForum().name} Forum
                </h3>
                <p className="text-gray-600 text-sm">
                  Discussions specific to {getCurrentForum().name}. Share tips,
                  experiences, and connect with other {getCurrentForum().name} users.
                </p>
              </div>
            )}

            <ForumPostsList
              posts={filteredPosts}
              loading={postsLoading}
              userVotes={userVotes}
              onVote={onVote}
              onOpenComments={openCommentsModal}
              onCreateFirstPost={() => checkUsernameBeforeAction(() => setShowCreateModal(true))}
              getDisplayScores={getDisplayScores}
              getCategoryColor={getCategoryColor}
              emptyStateMessage={getEmptyStateMessage()}
            />
          </div>
        </div>

        {/* Modals */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          categories={categories}
          forum={getCurrentForum()}
          loading={actionLoading}
          models={models}
        />

        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          post={selectedPost}
          currentUser={currentUser}
          onAddComment={handleAddComment}
          loading={actionLoading}
          onUsernameRequired={() => setShowUsernameModal(true)}
        />
        
        <UsernameSetupModal
          isOpen={showUsernameModal}
          onClose={() => {
            if (hasUsername) {
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
