"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Clock,
  Eye,
  Hash,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ModelForumTabProps {
  modelName: string;
}

// Mock forum data - in a real app, this would come from an API
const mockForumData = {
  stats: {
    totalPosts: 1247,
    totalMembers: 892,
    onlineMembers: 34,
    todaysPosts: 15,
  },
  categories: [
    { id: "general", name: "General Discussion", posts: 342, icon: MessageSquare, color: "blue" },
    { id: "tips", name: "Tips & Tricks", posts: 156, icon: Star, color: "yellow" },
    { id: "feedback", name: "Feedback", posts: 89, icon: ThumbsUp, color: "green" },
    { id: "announcements", name: "Announcements", posts: 23, icon: Flame, color: "red" },
  ],
  recentPosts: [
    {
      id: "1",
      title: "Best practices for content creation",
      content: "I've been working with this creator for months and wanted to share some insights...",
      author: {
        username: "ContentPro21",
        avatar: "/placeholder-image.jpg",
        isVerified: true,
      },
      category: "tips",
      createdAt: "2 hours ago",
      updatedAt: "1 hour ago",
      upvotes: 24,
      downvotes: 2,
      comments: 8,
      views: 156,
      isPinned: false,
      isHot: true,
    },
    {
      id: "2", 
      title: "Monthly revenue report discussion",
      content: "Let's discuss the latest trends and share our experiences...",
      author: {
        username: "DataAnalyst",
        avatar: "/placeholder-image.jpg",
        isVerified: false,
      },
      category: "general",
      createdAt: "4 hours ago",
      updatedAt: "3 hours ago",
      upvotes: 15,
      downvotes: 1,
      comments: 12,
      views: 203,
      isPinned: true,
      isHot: false,
    },
    {
      id: "3",
      title: "New features request",
      content: "Would love to see some improvements in the dashboard interface...",
      author: {
        username: "UIExpert",
        avatar: "/placeholder-image.jpg",
        isVerified: true,
      },
      category: "feedback",
      createdAt: "1 day ago",
      updatedAt: "6 hours ago",
      upvotes: 8,
      downvotes: 0,
      comments: 5,
      views: 89,
      isPinned: false,
      isHot: false,
    },
  ],
};

const ForumStats = () => {
  const stats = [
    {
      label: "Total Posts",
      value: mockForumData.stats.totalPosts,
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30",
    },
    {
      label: "Members",
      value: mockForumData.stats.totalMembers,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30",
    },
    {
      label: "Online Now",
      value: mockForumData.stats.onlineMembers,
      icon: Eye,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30",
    },
    {
      label: "Today",
      value: mockForumData.stats.todaysPosts,
      icon: Calendar,
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={cn(
            "relative overflow-hidden bg-gradient-to-br border-0 shadow-sm hover:shadow-md transition-all duration-200",
            stat.bgColor
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-r text-white shadow-sm",
                  stat.color
                )}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const CategoryCard = ({ category, isSelected, onClick }: any) => {
  const Icon = category.icon;
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    yellow: "from-yellow-500 to-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
    green: "from-green-500 to-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
    red: "from-red-500 to-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
  };
  
  const colors = colorClasses[category.color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-102 border",
        isSelected ? colors.split('bg-')[1].split('border-')[0] + "shadow-lg scale-105" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-r text-white shadow-sm",
            colors.split(' ')[0] + " " + colors.split(' ')[1]
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {category.posts} posts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ForumPost = ({ post, onUpvote, onDownvote, onComment, onShare }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCategoryColor = (categoryId: string) => {
    const category = mockForumData.categories.find(c => c.id === categoryId);
    return category?.color || "blue";
  };

  const categoryColorClasses = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", 
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  const categoryColor = getCategoryColor(post.category);
  const categoryClass = categoryColorClasses[categoryColor as keyof typeof categoryColorClasses];

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 border-2 border-white shadow-sm rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center overflow-hidden">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.username}
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {post.author.username[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {post.author.username}
              </span>
              {post.author.isVerified && (
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                  ✓ Verified
                </Badge>
              )}
              <Badge className={cn("text-xs", categoryClass)}>
                {mockForumData.categories.find(c => c.id === post.category)?.name}
              </Badge>
              {post.isPinned && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  📌 Pinned
                </Badge>
              )}
              {post.isHot && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                  🔥 Hot
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-pink-600 dark:hover:text-pink-400 cursor-pointer transition-colors">
              {post.title}
            </h3>

            {/* Content Preview */}
            <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              {isExpanded ? post.content : `${post.content.substring(0, 150)}...`}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 ml-1 font-medium"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.createdAt}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views} views
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpvote(post.id)}
                  className="text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {post.upvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownvote(post.id)}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  {post.downvotes}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment(post.id)}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments} Comments
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(post.id)}
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ModelForumTab({ modelName }: ModelForumTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");

  const filteredPosts = useMemo(() => {
    let posts = [...mockForumData.recentPosts];
    
    // Filter by category
    if (selectedCategory !== "all") {
      posts = posts.filter(post => post.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort posts
    switch (sortBy) {
      case "hot":
        posts.sort((a, b) => (b.upvotes - b.downvotes + b.comments) - (a.upvotes - a.downvotes + a.comments));
        break;
      case "new":
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "top":
        posts.sort((a, b) => b.upvotes - a.upvotes);
        break;
    }
    
    return posts;
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCreatePost = () => {
    console.log("Create new post");
  };

  const handleUpvote = (postId: string) => {
    console.log("Upvote post:", postId);
  };

  const handleDownvote = (postId: string) => {
    console.log("Downvote post:", postId);
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {modelName} Forum
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Community discussions and insights about {modelName}
          </p>
        </div>
        <Button 
          onClick={handleCreatePost}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <ForumStats />

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "hot" | "new" | "top")}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="hot">🔥 Hot</option>
            <option value="new">🕒 New</option>
            <option value="top">⭐ Top</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CategoryCard
            category={{ id: "all", name: "All Categories", posts: mockForumData.recentPosts.length, icon: Hash, color: "blue" }}
            isSelected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          {mockForumData.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Discussions ({filteredPosts.length})
          </h3>
        </div>
        
        {filteredPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : `Be the first to start a discussion in the ${modelName} forum!`
                }
              </p>
              <Button onClick={handleCreatePost} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <ForumPost
                key={post.id}
                post={post}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}