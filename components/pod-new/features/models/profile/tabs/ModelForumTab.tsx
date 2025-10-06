"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Users,
  Calendar,
  Plus,
  MessageCircle,
  Eye,
  Clock,
  Pin,
  Lock,
  CheckCircle,
  TrendingUp,
  MoreHorizontal,
  Share,
  Loader2,
  MessagesSquare,
  User,
  Crown,
  Bell,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Rocket,
  Shield,
  PinOff,
  Unlock,
  XCircle,
  BarChart3,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useForumStats, useForumCategories, useForumThreads, useCreateThread } from "@/hooks/useForumData";
import { useModerateThread } from "@/hooks/useForumModeration";
import { AdvancedSearch } from "@/components/forum/AdvancedSearch";
import { ForumNotifications } from "@/components/forum/ForumNotifications";
import { TagManager } from "@/components/forum/TagManager";
import { AnalyticsDashboard } from "@/components/forum/AnalyticsDashboard";
import { ModerationDashboard } from "@/components/forum/ModerationDashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ModelForumTabProps {
  modelName: string;
}

const ForumStats: React.FC<{ modelId: string }> = ({ modelId }) => {
  const { data: stats, isLoading, error } = useForumStats(modelId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse w-24"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse w-16"></div>
                  <div className="h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse w-full"></div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse ml-4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="col-span-full border border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="text-red-600 dark:text-red-400">
              Failed to load forum stats. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      label: "TOTAL THREADS",
      value: stats?.totalThreads || 0,
      icon: MessageSquare,
      color: "blue",
    },
    {
      label: "TODAY",
      value: stats?.todayThreads || 0,
      icon: Calendar,
      color: "green",
    },
    {
      label: "ACTIVE USERS",
      value: stats?.activeUsers || 0,
      icon: Users,
      color: "purple",
    },
    {
      label: "TOTAL POSTS",
      value: stats?.totalPosts || 0,
      icon: MessageCircle,
      color: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {stat.label}
                  </p>
                  <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all duration-500",
                      stat.color === "blue" && "bg-gradient-to-r from-blue-500 to-blue-600",
                      stat.color === "green" && "bg-gradient-to-r from-green-500 to-green-600",
                      stat.color === "purple" && "bg-gradient-to-r from-purple-500 to-purple-600",
                      stat.color === "orange" && "bg-gradient-to-r from-orange-500 to-orange-600"
                    )} style={{ width: `${Math.min(100, (stat.value / 100) * 100)}%` }}></div>
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-xl ml-4",
                  stat.color === "blue" && "bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/20 border border-blue-200/50 dark:border-blue-500/30",
                  stat.color === "green" && "bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-400/20 dark:to-green-500/20 border border-green-200/50 dark:border-green-500/30",
                  stat.color === "purple" && "bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-400/20 dark:to-purple-500/20 border border-purple-200/50 dark:border-purple-500/30",
                  stat.color === "orange" && "bg-gradient-to-br from-orange-500/10 to-orange-600/10 dark:from-orange-400/20 dark:to-orange-500/20 border border-orange-200/50 dark:border-orange-500/30"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    stat.color === "blue" && "text-blue-600 dark:text-blue-400",
                    stat.color === "green" && "text-green-600 dark:text-green-400",
                    stat.color === "purple" && "text-purple-600 dark:text-purple-400",
                    stat.color === "orange" && "text-orange-600 dark:text-orange-400"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const CategoryChips: React.FC<{
  modelId: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}> = ({ modelId, selectedCategory, onCategoryChange }) => {
  const { data: categories = [], isLoading } = useForumCategories(modelId);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse" style={{ width: `${80 + (i * 20)}px` }}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Badge
        variant={selectedCategory === "all" ? "default" : "outline"}
        className={cn(
          "cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105",
          selectedCategory === "all" 
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-purple-600" 
            : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-pink-200 dark:hover:border-pink-700"
        )}
        onClick={() => onCategoryChange("all")}
      >
        All Discussions
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category.key}
          variant={selectedCategory === category.key ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105",
            selectedCategory === category.key
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-purple-600"
              : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-pink-200 dark:hover:border-pink-700"
          )}
          onClick={() => onCategoryChange(category.key)}
        >
          {category.name} ({category.threadCount || 0})
        </Badge>
      ))}
    </div>
  );
};

const ThreadRow: React.FC<{ thread: any }> = ({ thread }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-pink-200/60 dark:hover:border-pink-700/60">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {thread.author.username[0].toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and badges */}
            <div className="flex items-start gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {thread.pinned && (
                  <Pin className="w-4 h-4 text-orange-500" />
                )}
                {thread.locked && (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
                {thread.solved && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border-0">
                  {thread.categoryKey.toUpperCase()}
                </Badge>
                {thread.author.role === "ADMIN" && (
                  <Badge variant="destructive" className="text-xs">
                    Staff
                  </Badge>
                )}
              </div>
            </div>

            {/* Thread title */}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 hover:text-transparent hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 hover:bg-clip-text cursor-pointer transition-all duration-200">
              {thread.title}
            </h3>

            {/* Meta information */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="font-medium">{thread.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(thread.createdAt)}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {thread.postCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {thread.views}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(thread.lastActivity)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

const ThreadList: React.FC<{ 
  modelId: string; 
  threads: any[]; 
  categories: any[] 
}> = ({ modelId, threads, categories }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const moderateThread = useModerateThread();
  
  if (!threads || threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-3xl" />
          <MessagesSquare className="w-20 h-20 text-gray-400 relative z-10 mb-6" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
          No Discussions Yet
        </h3>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Be the first to start a conversation in this forum
        </p>
      </div>
    );
  }

  const getCategoryColor = (key: string) => {
    const colors: Record<string, string> = {
      general: "from-blue-500/20 to-cyan-500/20",
      qa: "from-green-500/20 to-emerald-500/20",
      bugs: "from-red-500/20 to-pink-500/20",
      showcase: "from-purple-500/20 to-indigo-500/20",
      releases: "from-yellow-500/20 to-orange-500/20",
    };
    return colors[key.toLowerCase()] || colors.general;
  };

  const getCategoryIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      general: <MessageCircle className="w-4 h-4" />,
      qa: <HelpCircle className="w-4 h-4" />,
      bugs: <AlertCircle className="w-4 h-4" />,
      showcase: <Sparkles className="w-4 h-4" />,
      releases: <Rocket className="w-4 h-4" />,
    };
    return icons[key.toLowerCase()] || icons.general;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/my-models/${modelId}/forum/thread/${threadId}`);
  };

  return (
    <div className="space-y-3">
      {threads.map((thread, index) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleThreadClick(thread.id)}
          className="group relative cursor-pointer"
        >
          {/* Background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300" />
          
          <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              {/* Author Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    {thread.author.image ? (
                      <img
                        src={thread.author.image}
                        alt={thread.author.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                {thread.author.role === "ADMIN" && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>

              {/* Thread Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2">
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span className="font-medium">{thread.author.username}</span>
                      <span className="text-gray-600">•</span>
                      <span>{formatTimeAgo(thread.lastActivity)}</span>
                    </div>
                  </div>

                  {/* Thread Stats and Moderation */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>{thread.postCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>{thread.views}</span>
                      </div>
                      {thread.watching && (
                        <div className="text-purple-400">
                          <Bell className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>
                    
                    {/* Moderation Actions - Only show for ADMIN/MANAGER */}
                    {session?.user && ["ADMIN", "MANAGER"].includes(session.user.role || "") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-white/10">
                            <Shield className="w-4 h-4 text-purple-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              moderateThread.mutate({
                                modelId,
                                threadId: thread.id,
                                action: thread.pinned ? "unpin" : "pin",
                              });
                            }}
                          >
                            {thread.pinned ? (
                              <>
                                <PinOff className="w-4 h-4 mr-2" />
                                Unpin Thread
                              </>
                            ) : (
                              <>
                                <Pin className="w-4 h-4 mr-2" />
                                Pin Thread
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              moderateThread.mutate({
                                modelId,
                                threadId: thread.id,
                                action: thread.locked ? "unlock" : "lock",
                              });
                            }}
                          >
                            {thread.locked ? (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Unlock Thread
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Lock Thread
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          {thread.categoryKey === "qa" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moderateThread.mutate({
                                    modelId,
                                    threadId: thread.id,
                                    action: thread.solved ? "unsolve" : "solve",
                                  });
                                }}
                              >
                                {thread.solved ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Mark as Unsolved
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as Solved
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Thread Export */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Download className="w-4 h-4 mr-2" />
                            Export Thread
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Tags and Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(thread.categoryKey)} backdrop-blur-sm`}>
                    {getCategoryIcon(thread.categoryKey)}
                    <span className="text-xs font-medium text-white/90 capitalize">
                      {thread.categoryKey}
                    </span>
                  </div>

                  {/* Status Badges */}
                  {thread.pinned && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                      <Pin className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">Pinned</span>
                    </div>
                  )}
                  {thread.solved && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-xs font-medium text-green-400">Solved</span>
                    </div>
                  )}
                  {thread.locked && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                      <Lock className="w-3 h-3 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hover Effect - Arrow */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
              <ChevronRight className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};


// Thread Creation Dialog Component
const CreateThreadDialog: React.FC<{ modelId: string; categories: any[] }> = ({ modelId, categories }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createThreadMutation = useCreateThread(modelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createThreadMutation.mutateAsync({
        title: title.trim(),
        categoryKey,
        content: content.trim(),
      });
      
      toast.success("Discussion thread created successfully!");
      setOpen(false);
      setTitle("");
      setContent("");
      setCategoryKey("GENERAL");
    } catch (error: any) {
      toast.error(error.message || "Failed to create thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25 transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Start a New Discussion
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Discussion Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, descriptive title for your discussion..."
              className="h-11 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 rounded-xl"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/200 characters</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select value={categoryKey} onValueChange={setCategoryKey}>
              <SelectTrigger className="h-11 bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 rounded-xl">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="GENERAL">General Discussion</SelectItem>
                <SelectItem value="QA">Questions & Answers</SelectItem>
                <SelectItem value="BUGS">Bug Reports</SelectItem>
                <SelectItem value="SHOWCASE">Showcase</SelectItem>
                <SelectItem value="RELEASES">Releases & Updates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Message *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask questions, or start a conversation with the community..."
              className="min-h-[120px] bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 rounded-xl resize-y"
              maxLength={50000}
              required
            />
            <p className="text-xs text-gray-500">{content.length}/50,000 characters</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 rounded-xl border-gray-200 dark:border-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 h-11 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Create Discussion
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ModelForumTab({ modelName }: ModelForumTabProps) {
  const { data: session } = useSession();
  const [searchFilters, setSearchFilters] = useState<{
    query: string;
    category: string[];
    status: string[];
    author: string;
    dateRange: { from: Date | null; to: Date | null };
    sortBy: string;
    minReplies: number;
    minViews: number;
    hasAttachments: boolean;
    isWatching: boolean;
  }>({
    query: "",
    category: [],
    status: [],
    author: "",
    dateRange: { from: null, to: null },
    sortBy: "recent",
    minReplies: 0,
    minViews: 0,
    hasAttachments: false,
    isWatching: false,
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showModeration, setShowModeration] = useState(false);

  // Convert model name to a model ID (in a real app, you'd get this from props or context)
  const modelId = modelName.toLowerCase().replace(/\s+/g, "-");
  
  // Fetch categories for the create thread dialog
  const { data: categories = [] } = useForumCategories(modelId);
  
  // Fetch threads data
  const { data: threadsData } = useForumThreads(modelId, {
    category: searchFilters.category.length > 0 ? searchFilters.category.join(",") :
             (selectedCategory !== "all" ? selectedCategory : undefined),
    sort: searchFilters.sortBy,
    search: searchFilters.query || undefined,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 mb-8 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Title Section with Enhanced Typography */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                    <MessageSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {modelName} Forum
                      </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                      Community discussions and support for {modelName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Forum
                      </span>
                      <span>•</span>
                      <span>Updated in real-time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Forum Notifications - Only show if user is logged in */}
                <ForumNotifications userId={session?.user?.id || ""} />

                {/* Analytics Dashboard - Only show for ADMIN/MANAGER users */}
                {session?.user && ["ADMIN", "MANAGER"].includes(session.user.role || "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalytics(true)}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                )}

                {/* Moderation Dashboard - Only show for ADMIN users */}
                {session?.user && session.user.role === "ADMIN" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModeration(true)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Moderation
                  </Button>
                )}

                {/* Tag Manager - Only show for ADMIN/MANAGER users */}
                {session?.user && ["ADMIN", "MANAGER"].includes(session.user.role || "") && (
                  <TagManager modelId={modelId} mode="manage" />
                )}

                <CreateThreadDialog modelId={modelId} categories={categories} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <ForumStats modelId={modelId} />

        {/* Advanced Search */}
        <div className="mb-6">
          <AdvancedSearch
            modelId={modelId}
            onSearch={setSearchFilters}
            initialFilters={searchFilters}
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            Discussion Categories
          </h3>
          <CategoryChips
            modelId={modelId}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Thread List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Recent Discussions
            </h3>
          </div>
          <ThreadList
            modelId={modelId}
            threads={threadsData?.threads || []}
            categories={categories}
          />
        </div>
      </div>

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Forum Analytics Dashboard
              </DialogTitle>
            </DialogHeader>
            <AnalyticsDashboard modelId={modelId} />
          </DialogContent>
        </Dialog>
      )}

      {/* Moderation Dashboard Modal */}
      {showModeration && (
        <Dialog open={showModeration} onOpenChange={setShowModeration}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Forum Moderation Dashboard
              </DialogTitle>
            </DialogHeader>
            <ModerationDashboard modelId={modelId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}