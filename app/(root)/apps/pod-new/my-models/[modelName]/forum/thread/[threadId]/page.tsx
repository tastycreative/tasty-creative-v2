"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  ThumbsUp,
  Eye,
  Pin,
  Lock,
  CheckCircle,
  User,
  Crown,
  Calendar,
  Reply,
  MoreHorizontal,
  Flag,
  Share,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModelProfileLayout } from "@/components/pod-new/layouts/ModelProfileLayout";
import type { ExtendedModelDetails } from "@/lib/mock-data/model-profile";

interface ThreadViewPageProps {
  params: Promise<{
    modelName: string;
    threadId: string;
  }>;
}

function createSkeletonModel(name: string): ExtendedModelDetails {
  const now = new Date().toISOString();
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    status: "active",
    launchDate: now,
    referrerName: "",
    personalityType: "",
    commonTerms: [],
    commonEmojis: [],
    instagram: undefined,
    twitter: undefined,
    tiktok: undefined,
    chattingManagers: [],
    profileImage: undefined,
    stats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      subscribers: 0,
      avgResponseTime: "",
    },
    profile: {
      bio: "",
      location: "",
      timezone: "",
      languages: [],
      joinedDate: now,
      lastActive: now,
      verificationStatus: "verified",
      badges: [],
    },
    analytics: {
      performanceScore: 0,
      growthRate: 0,
      engagementRate: 0,
      satisfactionScore: 0,
      responseTime: { average: "", trend: 0 },
      revenue: {
        thisMonth: 0,
        lastMonth: 0,
        trend: 0,
        breakdown: {
          tips: 0,
          subscriptions: 0,
          customs: 0,
          other: 0,
        },
      },
      subscribers: {
        total: 0,
        active: 0,
        trend: 0,
        newThisMonth: 0,
      },
    },
    settings: {
      visibility: "public",
      allowMessages: true,
      autoResponder: false,
      messageTemplate: "",
      workingHours: {
        enabled: false,
        timezone: "UTC",
        schedule: {},
      },
      pricing: {
        subscriptionPrice: 0,
        messagePrice: 0,
        mediaPrice: 0,
      },
    },
  };
}

// Component for the thread content that will be rendered inside the layout
function ThreadViewContent({ modelName, threadId }: { modelName: string; threadId: string }) {
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real thread data from the API
  const [threadData, setThreadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/models/${modelName.toLowerCase()}/forum/threads/${threadId}`);
        if (!response.ok) {
          throw new Error('Thread not found');
        }
        const data = await response.json();
        setThreadData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [modelName, threadId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-8"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !threadData) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Thread Not Found</h2>
            <p className="text-gray-400 mb-4">
              {error || "The thread you're looking for doesn't exist or has been deleted."}
            </p>
            <Button
              onClick={() => router.push(`/apps/pod-new/my-models/${modelName}?tab=forum`)}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Button>
          </div>
        </div>
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/models/${modelName.toLowerCase()}/forum/threads/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }

      const newPost = await response.json();
      
      // Update the thread data with the new post
      setThreadData((prev: any) => prev ? ({
        ...prev,
        posts: [...prev.posts, newPost],
        postCount: prev.postCount + 1,
      }) : null);
      
      setReplyContent("");
    } catch (err) {
      console.error('Error posting reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const response = await fetch(`/api/models/${modelName.toLowerCase()}/forum/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to react');
      }

      // Refetch the thread data to get updated reaction counts
      const threadResponse = await fetch(`/api/models/${modelName.toLowerCase()}/forum/threads/${threadId}`);
      if (threadResponse.ok) {
        const updatedThread = await threadResponse.json();
        setThreadData(updatedThread);
      }
    } catch (err) {
      console.error('Error handling reaction:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={() => router.push(`/apps/pod-new/my-models/${modelName}?tab=forum`)}
            className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </motion.div>

        {/* Thread Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-6"
        >
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(threadData.categoryKey)} backdrop-blur-sm`}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium text-white/90 capitalize">
                    {threadData.categoryKey}
                  </span>
                </div>
                
                {threadData.pinned && (
                  <Badge variant="secondary" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                
                {threadData.solved && (
                  <Badge variant="secondary" className="bg-green-500/20 border-green-500/30 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Solved
                  </Badge>
                )}
                
                {threadData.locked && (
                  <Badge variant="secondary" className="bg-red-500/20 border-red-500/30 text-red-400">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                {threadData.title}
              </h1>
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      {threadData.author.image ? (
                        <img
                          src={threadData.author.image}
                          alt={threadData.author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <span className="font-medium text-white">{threadData.author.username}</span>
                  {threadData.author.role === "ADMIN" && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTimeAgo(threadData.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{threadData.views.toLocaleString()} views</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{threadData.posts.length} replies</span>
                </div>
              </div>
            </div>
            
            {/* Thread Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                <Share className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-white/10">
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Posts */}
        <div className="space-y-6">
          {threadData.posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Author Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                          {post.author.image ? (
                            <img
                              src={post.author.image}
                              alt={post.author.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {post.author.role === "ADMIN" && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white">{post.author.username}</span>
                          <span className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-white/10">
                            <DropdownMenuItem className="text-white hover:bg-white/10">
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-white/10">
                              <Flag className="w-4 h-4 mr-2" />
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="prose prose-invert max-w-none mb-4">
                        <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
                      </div>
                      
                      {/* Post Reactions */}
                      <div className="flex items-center gap-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                          onClick={() => handleReaction(post.id, 'LIKE')}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {post.reactions.find(r => r.type === 'LIKE')?.count || 0}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                          onClick={() => handleReaction(post.id, 'HELPFUL')}
                        >
                          <span className="mr-1">✨</span>
                          {post.reactions.find(r => r.type === 'HELPFUL')?.count || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reply Form */}
        {!threadData.locked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add your reply</h3>
                <form onSubmit={handleReply} className="space-y-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Share your thoughts, insights, or ask follow-up questions..."
                    className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-400"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Supports Markdown formatting
                    </span>
                    <Button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      {isSubmitting ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default async function ThreadViewPage({ params }: ThreadViewPageProps) {
  const { modelName, threadId } = await params;
  const modelData = createSkeletonModel(modelName);
  
  return (
    <ModelProfileLayout modelData={modelData} creatorName={modelName}>
      <ThreadViewContent modelName={modelName} threadId={threadId} />
    </ModelProfileLayout>
  );
}