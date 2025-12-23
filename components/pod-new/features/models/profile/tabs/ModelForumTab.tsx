"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Plus,
  MessageCircle,
  Eye,
  Pin,
  Lock,
  CheckCircle,
  Search,
  User,
  Crown,
  ChevronRight,
  Loader2,
  Settings,
  BarChart3,
  Shield,
  TrendingUp,
  Flame,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useForumStats,
  useForumCategories,
  useForumThreads,
  useCreateThread,
} from "@/hooks/useForumData";
import { AnalyticsDashboard } from "@/components/forum/AnalyticsDashboard";
import { ModerationDashboard } from "@/components/forum/ModerationDashboard";
import { TagManager } from "@/components/forum/TagManager";

interface ModelForumTabProps {
  modelName: string;
}

// Compact inline stats
const CompactStats: React.FC<{ modelId: string }> = ({ modelId }) => {
  const { data: stats, isLoading } = useForumStats(modelId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 text-sm">
      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">{stats?.totalThreads || 0}</span> threads
      </span>
      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">{stats?.totalPosts || 0}</span> posts
      </span>
      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-medium">{stats?.activeUsers || 0}</span> active
      </span>
    </div>
  );
};

// Simple category filter pills
const CategoryPills: React.FC<{
  selected: string;
  onChange: (category: string) => void;
}> = ({ selected, onChange }) => {
  const categories = [
    { key: "all", label: "All", icon: Flame },
    { key: "general", label: "General", icon: MessageCircle },
    { key: "qa", label: "Q&A", icon: HelpCircle },
    { key: "showcase", label: "Showcase", icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-2">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};

// Minimal thread card
const ThreadCard: React.FC<{ thread: any; onClick: () => void }> = ({
  thread,
  onClick,
}) => {
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800 hover:border-pink-300 dark:hover:border-pink-700 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            {thread.author?.image ? (
              <img
                src={thread.author.image}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              thread.author?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          {thread.author?.role === "ADMIN" && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-black" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {thread.pinned && (
              <Pin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            )}
            {thread.solved && (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            )}
            {thread.locked && (
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1">
            {thread.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">{thread.author?.username}</span>
            <span>•</span>
            <span>{formatTimeAgo(thread.lastActivity || thread.createdAt)}</span>
          </div>
        </div>

        {/* Stats & Arrow */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {thread.postCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {thread.views || 0}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
};

// Quick post input - Enhanced with animation
const QuickPostInput: React.FC<{
  onExpand: () => void;
  placeholder?: string;
}> = ({ onExpand, placeholder }) => {
  return (
    <motion.button
      onClick={onExpand}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-pink-600/50 hover:shadow-lg hover:shadow-pink-500/5 transition-all duration-300 group"
    >
      {/* Animated Avatar */}
      <div className="relative">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/40 transition-shadow">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
      </div>
      
      {/* Text content */}
      <div className="flex-1 text-left">
        <p className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
          {placeholder || "What's on your mind?"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Share thoughts, ask questions, or start a conversation
        </p>
      </div>
      
      {/* Keyboard hint */}
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-400">
        <kbd className="font-mono">⌘</kbd>
        <kbd className="font-mono">N</kbd>
      </div>
    </motion.button>
  );
};

// Thread creation dialog - Premium Design
const CreateThreadDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  modelId: string;
}> = ({ open, onClose, modelId }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createThread = useCreateThread(modelId);

  const categories = [
    {
      key: "GENERAL",
      label: "General",
      icon: MessageCircle,
      description: "Open discussions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      key: "QA",
      label: "Q&A",
      icon: HelpCircle,
      description: "Ask questions",
      color: "from-green-500 to-emerald-500",
    },
    {
      key: "SHOWCASE",
      label: "Showcase",
      icon: Sparkles,
      description: "Share your work",
      color: "from-purple-500 to-pink-500",
    },
    {
      key: "BUGS",
      label: "Bug Report",
      icon: Eye,
      description: "Report issues",
      color: "from-orange-500 to-red-500",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createThread.mutateAsync({
        title: title.trim(),
        categoryKey: category,
        content: content.trim(),
      });
      toast.success("Discussion started!");
      onClose();
      setTitle("");
      setContent("");
      setCategory("GENERAL");
    } catch (error: any) {
      toast.error(error.message || "Failed to create thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.key === category);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-2xl">
        {/* Gradient Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-blue-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.1),transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-pink-500/25">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Start a Discussion
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share your thoughts with the community
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Category Selection - Card Grid */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={cn(
                      "relative p-3 rounded-xl text-left transition-all duration-200 border-2",
                      isSelected
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          "p-1.5 rounded-lg bg-gradient-to-br",
                          cat.color
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold truncate",
                            isSelected
                              ? "text-pink-600 dark:text-pink-400"
                              : "text-gray-700 dark:text-gray-200"
                          )}
                        >
                          {cat.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-pink-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="h-12 text-base bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
              maxLength={200}
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400">
                {title.length}/200
              </span>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label
              htmlFor="content"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask questions, or start a conversation..."
              className="min-h-[140px] text-base bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
              maxLength={10000}
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400">
                {content.length.toLocaleString()}/10,000
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Post Discussion
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Empty state - Enhanced with floating animation
const EmptyState: React.FC<{ onCreateThread: () => void }> = ({
  onCreateThread,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-4"
  >
    {/* Floating animated icon */}
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="relative mb-6"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl blur-2xl opacity-30" />
      
      {/* Icon container */}
      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-pink-500/30">
        <MessageSquare className="w-10 h-10 text-white" />
      </div>
      
      {/* Decorative dots */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-950"
      />
    </motion.div>
    
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      Start the conversation
    </h3>
    <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
      Be the first to share your thoughts and connect with the community. Your post could spark something amazing!
    </p>
    
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onCreateThread}
        size="lg"
        className="h-12 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all"
      >
        <Plus className="w-5 h-5 mr-2" />
        Start First Discussion
      </Button>
    </motion.div>
    
    {/* Hint text */}
    <p className="mt-4 text-xs text-gray-400">
      Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">⌘ N</kbd> to create
    </p>
  </motion.div>
);

export default function ModelForumTab({ modelName }: ModelForumTabProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showModeration, setShowModeration] = useState(false);

  const modelId = modelName.toLowerCase().replace(/\s+/g, "-");

  const { data: threadsData, isLoading } = useForumThreads(modelId, {
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    sort: sortBy,
    search: searchQuery || undefined,
  });

  const isAdmin = session?.user?.role === "ADMIN";
  const isManager = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Forum
            </h1>
            <div className="mt-1">
              <CompactStats modelId={modelId} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowAnalytics(true)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setShowModeration(true)}>
                      <Shield className="w-4 h-4 mr-2" />
                      Moderation
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <TagManager modelId={modelId} mode="manage" />
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Button>
          </div>
        </div>

        {/* Quick Post */}
        <div className="mb-6">
          <QuickPostInput
            onExpand={() => setShowCreateDialog(true)}
            placeholder="What's on your mind?"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="pl-10 h-10 bg-white dark:bg-gray-900/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <CategoryPills
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-10 bg-white dark:bg-gray-900/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thread List */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : (threadsData?.threads?.length ?? 0) > 0 ? (
            threadsData?.threads?.map((thread: any) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onClick={() => {
                  // Navigate to thread detail
                  window.location.href = `/my-models/${modelName}/forum/thread/${thread.id}`;
                }}
              />
            ))
          ) : (
            <EmptyState onCreateThread={() => setShowCreateDialog(true)} />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateThreadDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        modelId={modelId}
      />

      {showAnalytics && (
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Forum Analytics</DialogTitle>
            </DialogHeader>
            <AnalyticsDashboard modelId={modelId} />
          </DialogContent>
        </Dialog>
      )}

      {showModeration && (
        <Dialog open={showModeration} onOpenChange={setShowModeration}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Moderation</DialogTitle>
            </DialogHeader>
            <ModerationDashboard modelId={modelId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}