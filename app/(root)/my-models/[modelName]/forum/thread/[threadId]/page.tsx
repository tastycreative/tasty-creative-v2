"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2,
  AlertCircle,
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
import { useThreadDetail, useCreatePost, PostAttachment } from "@/hooks/useThreadDetail";
import { formatDistanceToNow } from "date-fns";
import { TaskAttachment } from "@/lib/stores/boardStore";
import CommentFileUpload from "@/components/ui/CommentFileUpload";
import AttachmentViewer from "@/components/ui/AttachmentViewer";

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

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </CardContent>
      </Card>

      {[...Array(3)].map((_, i) => (
        <Card key={i} className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Thread
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ThreadPage({ params }: ThreadPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{
    modelName: string;
    threadId: string;
  } | null>(null);
  const [modelData, setModelData] = useState<ExtendedModelDetails | null>(null);
  const [replyText, setReplyText] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      const decodedName = decodeURIComponent(p.modelName);
      setModelData(createSkeletonModel(decodedName));
    });
  }, [params]);

  const modelId = resolvedParams?.modelName.toLowerCase().replace(/\s+/g, "-") || "";
  const threadId = resolvedParams?.threadId || "";

  const {
    data: thread,
    isLoading,
    error,
    refetch,
  } = useThreadDetail(modelId, threadId);

  const createPostMutation = useCreatePost(modelId, threadId);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    try {
      // Convert TaskAttachment to PostAttachment format
      const postAttachments: PostAttachment[] | undefined = attachments.length > 0
        ? attachments.map(att => ({
            id: att.id,
            url: att.url,
            filename: att.filename,
            type: att.type,
            size: att.size,
          }))
        : undefined;

      await createPostMutation.mutateAsync({
        content: replyText.trim(),
        attachments: postAttachments,
      });
      setReplyText("");
      setAttachments([]); // Clear attachments after successful post
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return new Date(dateString).toLocaleDateString();
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") {
      return (
        <Badge variant="destructive" className="text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (role === "MANAGER" || role === "MODERATOR") {
      return (
        <Badge variant="secondary" className="text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Mod
        </Badge>
      );
    }
    return null;
  };

  if (!resolvedParams || !modelData) {
    return (
      <ModelProfileLayout modelData={createSkeletonModel("Loading...")}>
        <LoadingSkeleton />
      </ModelProfileLayout>
    );
  }

  if (isLoading) {
    return (
      <ModelProfileLayout modelData={modelData}>
        <LoadingSkeleton />
      </ModelProfileLayout>
    );
  }

  if (error) {
    return (
      <ModelProfileLayout modelData={modelData}>
        <ErrorState
          message={error instanceof Error ? error.message : "An unexpected error occurred"}
          onRetry={() => refetch()}
        />
      </ModelProfileLayout>
    );
  }

  if (!thread) {
    return (
      <ModelProfileLayout modelData={modelData}>
        <ErrorState message="Thread not found" onRetry={() => router.back()} />
      </ModelProfileLayout>
    );
  }

  // Find the first post (original post) and separate it from replies
  const firstPost = thread.posts[0];
  const replies = thread.posts.slice(1);

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
                  {thread.author.image ? (
                    <img
                      src={thread.author.image}
                      alt={thread.author.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {thread.author.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{thread.author.username}</span>
                      {getRoleBadge(thread.author.role)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatTimeAgo(thread.createdAt)}
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
                {thread.pinned && <Pin className="w-4 h-4 text-blue-600" />}
                {thread.locked && <Lock className="w-4 h-4 text-gray-600" />}
                {thread.solved && <CheckCircle className="w-4 h-4 text-green-600" />}
                <h1 className="text-xl font-semibold">{thread.title}</h1>
              </div>

              {/* First Post Content */}
              {firstPost && (
                <>
                  <div className="prose dark:prose-invert mb-4 max-w-none">
                    <p className="whitespace-pre-wrap">{firstPost.content_md}</p>
                  </div>

                  {/* First Post Attachments */}
                  {firstPost.attachments && firstPost.attachments.length > 0 && (
                    <div className="mb-4">
                      <AttachmentViewer
                        attachments={firstPost.attachments.map(att => ({
                          id: att.id,
                          url: att.url,
                          name: att.filename,
                          type: att.type,
                          size: att.size,
                        }))}
                        showTitle={true}
                        compact={false}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Thread Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {thread.views} views
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {thread.postCount} {thread.postCount === 1 ? "post" : "posts"}
                </div>
                {thread.watching && (
                  <Badge variant="outline" className="text-xs">
                    Watching
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Reply className="w-5 h-5" />
                Replies ({replies.length})
              </h3>
              <AnimatePresence>
                {replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {reply.author.image ? (
                              <img
                                src={reply.author.image}
                                alt={reply.author.username}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {reply.author.username[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{reply.author.username}</span>
                                {getRoleBadge(reply.author.role)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTimeAgo(reply.createdAt)}
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

                        <p className="text-sm mb-3 whitespace-pre-wrap">{reply.content_md}</p>

                        {/* Reply Attachments */}
                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="mb-3">
                            <AttachmentViewer
                              attachments={reply.attachments.map(att => ({
                                id: att.id,
                                url: att.url,
                                name: att.filename,
                                type: att.type,
                                size: att.size,
                              }))}
                              showTitle={true}
                              compact={true}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-xs">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {reply.reactions.reduce((sum, r) => sum + r.count, 0)}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Reply Form */}
          {!thread.locked ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Post a Reply</h3>

                {/* File Upload */}
                <div className="mb-3">
                  <CommentFileUpload
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                    maxFiles={5}
                    maxFileSize={10}
                  />
                </div>

                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="mb-3"
                  rows={3}
                  disabled={createPostMutation.isPending}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-300 dark:border-gray-600">
              <CardContent className="p-4 text-center">
                <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">This thread is locked</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ModelProfileLayout>
  );
}
