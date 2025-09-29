"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface ThreadPageProps {
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
        breakdown: { tips: 0, subscriptions: 0, customs: 0, other: 0 },
      },
      subscribers: { total: 0, active: 0, trend: 0, newThisMonth: 0 },
    },
    assets: {
      totalImages: 0,
      categories: { profilePhotos: 0, contentImages: 0, promotional: 0 },
      recentUploads: [],
    },
    chatters: {
      totalChatters: 0,
      activeChatters: 0,
      topChatters: [],
      recentActivity: [],
      analytics: { avgSessionTime: "", responseRate: 0, tipConversionRate: 0 },
    },
    apps: {
      connected: [],
      available: [],
    },
    gallery: {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      recentPosts: [],
      topPerforming: [],
    },
    forum: {
      totalThreads: 0,
      totalPosts: 0,
      moderationQueue: 0,
      recentActivity: [],
      popularThreads: [],
    },
  };
}

export default function ThreadPage({ params }: ThreadPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{
    modelName: string;
    threadId: string;
  } | null>(null);
  const [modelData, setModelData] = useState<ExtendedModelDetails | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      const decodedName = decodeURIComponent(p.modelName);
      setModelData(createSkeletonModel(decodedName));
    });
  }, [params]);

  if (!resolvedParams || !modelData) {
    return (
      <ModelProfileLayout modelData={createSkeletonModel("Loading...")}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading thread...</p>
          </div>
        </div>
      </ModelProfileLayout>
    );
  }

  // Mock thread data
  const threadData = {
    id: resolvedParams.threadId,
    title: "Welcome to the Community Forum",
    content: "This is a sample thread for demonstration purposes. Feel free to engage with the community!",
    author: {
      username: "moderator",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      role: "moderator",
    },
    createdAt: new Date().toISOString(),
    views: 156,
    likes: 23,
    replies: 8,
    isPinned: true,
    isLocked: false,
  };

  const replies = [
    {
      id: "1",
      content: "Thanks for setting up this community space!",
      author: {
        username: "fan_user_1",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        role: "user",
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 5,
    },
    {
      id: "2",
      content: "Looking forward to more discussions here.",
      author: {
        username: "supporter_2",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        role: "user",
      },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      likes: 3,
    },
  ];

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      console.log("Submitting reply:", replyText);
      setReplyText("");
    }
  };

  return (
    <ModelProfileLayout modelData={modelData}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Forum
            </Button>
          </div>

          {/* Thread */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {/* Thread Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={threadData.author.avatar}
                    alt={threadData.author.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{threadData.author.username}</span>
                      {threadData.author.role === "moderator" && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Mod
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(threadData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thread Title */}
              <div className="flex items-center gap-2 mb-3">
                {threadData.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                {threadData.isLocked && <Lock className="w-4 h-4 text-gray-600" />}
                <h1 className="text-xl font-semibold">{threadData.title}</h1>
              </div>

              {/* Thread Content */}
              <div className="prose dark:prose-invert mb-4">
                <p>{threadData.content}</p>
              </div>

              {/* Thread Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {threadData.views} views
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {threadData.likes} likes
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {threadData.replies} replies
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-4 mb-6">
            {replies.map((reply, index) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={reply.author.avatar}
                          alt={reply.author.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <span className="font-medium text-sm">{reply.author.username}</span>
                          <div className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Reply className="w-3 h-3 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Flag className="w-3 h-3 mr-2" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm mb-3">{reply.content}</p>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {reply.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Reply Form */}
          {!threadData.isLocked && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Post a Reply</h3>
                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitReply} disabled={!replyText.trim()}>
                    Post Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ModelProfileLayout>
  );
}