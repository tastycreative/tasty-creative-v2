"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  MessageSquare,
  AlertTriangle,
  Ban,
  UserCheck,
  Clock,
  Eye,
  Filter,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pin,
  Lock,
  Trash2,
  Flag,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  Activity,
  UserX,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";

interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  activeThreads: number;
  bannedUsers: number;
  lockedThreads: number;
  deletedPosts: number;
  moderatorActions: number;
}

interface ModerationItem {
  id: string;
  type: 'thread' | 'post' | 'user';
  status: 'pending' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: string;
  reportedBy: {
    username: string;
    id: string;
  };
  target: {
    id: string;
    title?: string;
    content?: string;
    author: {
      username: string;
      id: string;
    };
  };
  reason: string;
  category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  moderatorNotes?: string;
  resolvedBy?: {
    username: string;
    id: string;
  };
  resolvedAt?: string;
}

interface ModerationLog {
  id: string;
  action: string;
  moderator: {
    username: string;
    id: string;
  };
  target: {
    type: 'thread' | 'post' | 'user';
    id: string;
    title?: string;
  };
  reason?: string;
  timestamp: string;
}

export function ModerationDashboard({ modelId }: { modelId: string }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  // Mock data - in real app, fetch from API
  const [stats, setStats] = useState<ModerationStats>({
    totalReports: 47,
    pendingReports: 12,
    resolvedToday: 8,
    activeThreads: 234,
    bannedUsers: 3,
    lockedThreads: 15,
    deletedPosts: 28,
    moderatorActions: 156,
  });

  const [reports, setReports] = useState<ModerationItem[]>([
    {
      id: "1",
      type: "post",
      status: "pending",
      priority: "high",
      reportedAt: "2025-01-13T10:30:00Z",
      reportedBy: { username: "user123", id: "u1" },
      target: {
        id: "p1",
        content: "This is inappropriate content that violates community guidelines...",
        author: { username: "badactor", id: "u2" }
      },
      reason: "Inappropriate content and harassment",
      category: "harassment"
    },
    {
      id: "2",
      type: "thread",
      status: "pending",
      priority: "medium",
      reportedAt: "2025-01-13T09:15:00Z",
      reportedBy: { username: "moderator1", id: "u3" },
      target: {
        id: "t1",
        title: "Spam thread with promotional content",
        author: { username: "spammer", id: "u4" }
      },
      reason: "Commercial spam",
      category: "spam"
    },
  ]);

  const [moderationLog, setModerationLog] = useState<ModerationLog[]>([
    {
      id: "1",
      action: "POST_DELETED",
      moderator: { username: "admin", id: "u1" },
      target: { type: "post", id: "p123", title: "Inappropriate post" },
      reason: "Violated community guidelines",
      timestamp: "2025-01-13T11:00:00Z"
    },
    {
      id: "2",
      action: "THREAD_LOCKED",
      moderator: { username: "mod1", id: "u2" },
      target: { type: "thread", id: "t456", title: "Heated discussion thread" },
      reason: "Discussion became unproductive",
      timestamp: "2025-01-13T10:45:00Z"
    },
  ]);

  // Check if user has moderation permissions
  const canModerate = session?.user && ["ADMIN", "MANAGER"].includes(session.user.role || "");

  if (!canModerate) {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access the moderation dashboard.
        </p>
      </Card>
    );
  }

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'escalate') => {
    // In real app, make API call
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'resolve' ? 'resolved' : 'dismissed' }
        : report
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spam': return <MessageCircle className="w-4 h-4" />;
      case 'harassment': return <UserX className="w-4 h-4" />;
      case 'inappropriate': return <AlertTriangle className="w-4 h-4" />;
      case 'misinformation': return <Flag className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200/50 dark:border-blue-500/30">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Moderation Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage community standards and moderate content
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {stats.pendingReports > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {stats.pendingReports}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="logs">Activity Log</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        Pending Reports
                      </p>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {stats.pendingReports}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Resolved Today
                      </p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {stats.resolvedToday}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Active Threads
                      </p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {stats.activeThreads}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        Mod Actions
                      </p>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {stats.moderatorActions}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Moderation Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationLog.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.moderator.username} {log.action.toLowerCase().replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.target.title || `${log.target.type} ${log.target.id}`}
                        </p>
                        {log.reason && (
                          <p className="text-sm text-gray-500 mt-1">
                            Reason: {log.reason}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={cn("text-xs", getPriorityColor(report.priority))}>
                          {report.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {report.type.toUpperCase()}
                        </Badge>
                        <Badge
                          variant={report.status === 'pending' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {report.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {getCategoryIcon(report.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {report.target.title || 
                             (report.target.content?.substring(0, 100) + "...") ||
                             `${report.type} by ${report.target.author.username}`}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Reported by <strong>{report.reportedBy.username}</strong>
                            </span>
                            <span>•</span>
                            <span>{formatTimeAgo(report.reportedAt)}</span>
                            <span>•</span>
                            <span>
                              Target: <strong>{report.target.author.username}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedItem(report)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {report.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleReportAction(report.id, 'resolve')}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReportAction(report.id, 'dismiss')}
                              className="text-gray-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Dismiss
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReportAction(report.id, 'escalate')}
                              className="text-red-600"
                            >
                              <ArrowUpRight className="w-4 h-4 mr-2" />
                              Escalate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Bulk Thread Lock
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lock multiple threads at once
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        User Management
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ban, mute, or warn users
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Analytics Report
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generate moderation reports
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.moderator.username}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.target.title || `${log.target.type} ${log.target.id}`}
                        </p>
                        {log.reason && (
                          <p className="text-xs text-gray-500 mt-1">
                            {log.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(log.timestamp)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", getPriorityColor(selectedItem.priority))}>
                    {selectedItem.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedItem.type.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {selectedItem.category.toUpperCase()}
                  </Badge>
                </div>
                
                <div>
                  <Label className="font-semibold">Reported Content</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedItem.target.title && (
                      <p className="font-medium mb-1">{selectedItem.target.title}</p>
                    )}
                    {selectedItem.target.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedItem.target.content}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Report Reason</Label>
                  <p className="mt-1 text-sm">{selectedItem.reason}</p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => {
                      handleReportAction(selectedItem.id, 'resolve');
                      setSelectedItem(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolve Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleReportAction(selectedItem.id, 'dismiss');
                      setSelectedItem(null);
                    }}
                  >
                    Dismiss Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}