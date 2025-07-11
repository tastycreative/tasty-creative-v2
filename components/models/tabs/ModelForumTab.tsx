"use client";
import { useState } from "react";
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
} from "lucide-react";

interface ForumComment {
  id: string;
  content: string;
  author: string;
  avatar: string;
  upvotes: number;
  downvotes: number;
  timestamp: string;
  replies?: ForumComment[];
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  upvotes: number;
  downvotes: number;
  comments: ForumComment[];
  timestamp: string;
  category: string;
  isPinned?: boolean;
  awards?: number;
}

interface ModelForumTabProps {
  modelName: string;
}

// Mock data for the forum posts
const mockForumPosts: ForumPost[] = [
  {
    id: "1",
    title: "Best prompts for getting amazing responses from " + "this model",
    content:
      "I've been experimenting with different prompt styles and found that being very specific about the context really helps. Here are some techniques that work well...",
    author: "PromptMaster2024",
    avatar: "PM",
    upvotes: 234,
    downvotes: 12,
    comments: [
      {
        id: "c1",
        content:
          "Great tips! I've been using similar techniques and they work really well.",
        author: "AIEnthusiast",
        avatar: "AE",
        upvotes: 15,
        downvotes: 0,
        timestamp: "1 hour ago",
      },
      {
        id: "c2",
        content: "Could you share some specific examples? I'm still learning.",
        author: "NewUser123",
        avatar: "NU",
        upvotes: 8,
        downvotes: 1,
        timestamp: "45 minutes ago",
      },
    ],
    timestamp: "2 hours ago",
    category: "Tips & Tricks",
    isPinned: true,
    awards: 3,
  },
  {
    id: "2",
    title: "Character consistency tips?",
    content:
      "Anyone have good strategies for maintaining character consistency across longer conversations? Sometimes the model seems to drift from the personality...",
    author: "ChatEnthusiast",
    avatar: "CE",
    upvotes: 156,
    downvotes: 8,
    comments: [
      {
        id: "c3",
        content:
          "Try using character sheets and reminding the model periodically.",
        author: "RPGMaster",
        avatar: "RM",
        upvotes: 23,
        downvotes: 2,
        timestamp: "3 hours ago",
      },
    ],
    timestamp: "4 hours ago",
    category: "Discussion",
  },
  {
    id: "3",
    title: "Wow! This model just helped me with my creative writing",
    content:
      "I was stuck on a story for weeks and this model gave me the perfect breakthrough. The way it understands narrative structure is incredible!",
    author: "WriterAtHeart",
    avatar: "WH",
    upvotes: 89,
    downvotes: 3,
    comments: [],
    timestamp: "6 hours ago",
    category: "Success Story",
  },
  {
    id: "4",
    title: "Technical discussion: Model capabilities and limitations",
    content:
      "Let's have an in-depth discussion about what this model excels at and where it might struggle. I've noticed it's particularly good at...",
    author: "TechAnalyst",
    avatar: "TA",
    upvotes: 67,
    downvotes: 15,
    comments: [
      {
        id: "c4",
        content:
          "I've noticed it struggles with very long context windows sometimes.",
        author: "DevUser",
        avatar: "DU",
        upvotes: 12,
        downvotes: 3,
        timestamp: "1 day ago",
      },
    ],
    timestamp: "1 day ago",
    category: "Technical",
  },
  {
    id: "5",
    title: "Feature request: Better memory management",
    content:
      "Would love to see improvements in how the model handles context over longer conversations. Sometimes it forgets important details...",
    author: "FeatureFan",
    avatar: "FF",
    upvotes: 45,
    downvotes: 7,
    comments: [],
    timestamp: "2 days ago",
    category: "Feature Request",
  },
];

const categories = [
  { name: "All", color: "gray" },
  { name: "Tips & Tricks", color: "green" },
  { name: "Discussion", color: "blue" },
  { name: "Success Story", color: "purple" },
  { name: "Technical", color: "red" },
  { name: "Feature Request", color: "orange" },
];

export default function ModelForumTab({ modelName }: ModelForumTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [userVotes, setUserVotes] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const [posts, setPosts] = useState(mockForumPosts);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);

  // Form states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Discussion");
  const [newComment, setNewComment] = useState("");

  const handleVote = (postId: string, voteType: "up" | "down") => {
    setUserVotes((prev) => ({
      ...prev,
      [postId]: prev[postId] === voteType ? null : voteType,
    }));
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: ForumPost = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: "CurrentUser",
      avatar: "CU",
      upvotes: 0,
      downvotes: 0,
      comments: [],
      timestamp: "just now",
      category: newPostCategory,
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostTitle("");
    setNewPostContent("");
    setShowCreateModal(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: ForumComment = {
      id: Date.now().toString(),
      content: newComment,
      author: "CurrentUser",
      avatar: "CU",
      upvotes: 0,
      downvotes: 0,
      timestamp: "just now",
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === selectedPost.id
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );

    setSelectedPost((prev) =>
      prev ? { ...prev, comments: [...prev.comments, comment] } : null
    );
    setNewComment("");
  };

  const openCommentsModal = (post: ForumPost) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const filteredPosts = posts.filter(
    (post) => selectedCategory === "All" || post.category === selectedCategory
  );

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.name === category);
    return cat?.color || "gray";
  };

  return (
    <div className="space-y-6 bg-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Community Forum
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discuss, share tips, and connect with other {modelName} users
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Create Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Active Users
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            1,247
          </p>
        </div>
        <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Total Posts
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            8,432
          </p>
        </div>
        <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Posts Today
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            23
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Categories */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
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
                              : "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                    : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Sort by
          </p>
          <div className="flex gap-2">
            {[
              { id: "hot", label: "Hot", icon: TrendingUp },
              { id: "new", label: "New", icon: Clock },
              { id: "top", label: "Top", icon: Star },
            ].map((sort) => {
              const Icon = sort.icon;
              return (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id as "hot" | "new" | "top")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
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

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-100/80 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all"
          >
            <div className="p-4">
              <div className="flex gap-4">
                {/* Vote section */}
                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                  <button
                    onClick={() => handleVote(post.id, "up")}
                    className={`p-1 rounded-full transition-all ${
                      userVotes[post.id] === "up"
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">
                    {post.upvotes - post.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote(post.id, "down")}
                    className={`p-1 rounded-full transition-all ${
                      userVotes[post.id] === "down"
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && (
                      <Pin className="w-4 h-4 text-green-400" />
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        getCategoryColor(post.category) === "green"
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : getCategoryColor(post.category) === "blue"
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            : getCategoryColor(post.category) === "purple"
                              ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                              : getCategoryColor(post.category) === "red"
                                ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                : getCategoryColor(post.category) === "orange"
                                  ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                  : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      •
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.timestamp}
                    </span>
                    {post.awards && (
                      <>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
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
                    className="text-lg font-semibold text-gray-800 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors"
                  >
                    {post.title}
                  </h3>

                  {/* Content preview */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Author and actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {post.avatar}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        u/{post.author}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCommentsModal(post)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.comments.length}</span>
                      </button>
                      <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all">
                        <Share className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
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
              className="bg-gray-900 rounded-xl border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Create New Post
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.slice(1).map((category) => (
                      <option
                        key={category.name}
                        value={category.name}
                        className="bg-gray-800"
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Enter your post title..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    {/* Formatting toolbar */}
                    <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center gap-2">
                      <button className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
                        <Link className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your thoughts, tips, or questions..."
                      rows={6}
                      className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
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
              className="bg-gray-900 rounded-xl border border-white/20 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Comments</h3>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original Post */}
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {selectedPost.avatar}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    u/{selectedPost.author}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-400 text-sm">
                    {selectedPost.timestamp}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {selectedPost.title}
                </h4>
                <p className="text-gray-300 text-sm">{selectedPost.content}</p>
              </div>

              {/* Add Comment */}
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">CU</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {selectedPost.comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {comment.avatar}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        u/{comment.author}
                      </span>
                      <span className="text-gray-400 text-sm">•</span>
                      <span className="text-gray-400 text-sm">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                        <ArrowUp className="w-3 h-3" />
                        <span className="text-xs">{comment.upvotes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button className="text-xs text-gray-400 hover:text-white transition-colors ml-2">
                        Reply
                      </button>
                    </div>
                  </div>
                ))}

                {selectedPost.comments.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
