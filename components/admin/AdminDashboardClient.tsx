/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Trophy,
  Percent,
  Star,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Clock,
  Award,
  Medal,
  Loader2,
  Headphones,
  Image,
  FileText,
  Eye,
  ChevronUp,
  ChevronDown,
  Activity,
  UserCheck,
} from "lucide-react";
import CountUp from "react-countup";
import { API_KEY_PROFILES } from "@/app/services/elevenlabs-implementation";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalUsersThisMonth: number;
    userGrowthPercentage: number;
    usersByRole: Record<string, number>;
    voiceNoteCount?: number; //Add voiceNoteCount in DashboardData
    activeModelCount?: number; //Add activeModelCount in DashboardData
  };
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
    image: string | null;
  }>;
  userGrowthData: Array<{
    month: string;
    users: number;
  }>;
  vnSales: {
    vnSalesToday: number;
    vnSalesGrowth: number;
    totalVnCount: number;
    newVnToday: number;
    loyaltyPointsEarned: number;
    loyaltyPointsGrowth: number;
    averageVnPrice: number;
    priceIncrease: number;
    totalRevenue: number;
    salesByModel: Array<{
      name: string;
      sales: number;
      revenue: number;
      loyaltyPoints: number;
    }>;
  };
  analytics: {
    activeCampaigns: number;
    newCampaignsThisWeek: number;
    conversionRate: number;
    conversionGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    roi: number;
    roiGrowth: number;
  };
  contentGeneration: {
    totalContentGenerated: number;
    contentGeneratedToday: number;
    contentGrowth: number;
    contentByTracker: Array<{
      tracker: string;
      count: number;
    }>;
    recentActivities?: Array<{
      tracker: string;
      name: string;
      email: string;
      createdAt: string;
      activity: string;
      image?: string;
    }>;
  };
}

const ROLE_COLORS = {
  ADMIN: "#ef4444",
  MODERATOR: "#f59e0b",
  USER: "#10b981",
  GUEST: "#6b7280",
};

export function AdminDashboardClient({ data }: { data: DashboardData }) {
  const { stats, recentUsers, userGrowthData, analytics } = data;

  // State for real-time VN sales and voice data
  const [vnSalesData, setVnSalesData] = useState(data.vnSales);
  const [isLoadingVnStats, setIsLoadingVnStats] = useState(true);
  const [isLoadingVoiceStats, setIsLoadingVoiceStats] = useState(true);

  // State for content generation data
  const [contentGenerationData, setContentGenerationData] = useState(
    data.contentGeneration
  );
  const [isLoadingContentStats, setIsLoadingContentStats] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [isLoadingMassMessages, setIsLoadingMassMessages] = useState(false);
  const [totalMassMessages, setTotalMassMessages] = useState(0);
  const [massMessagingLeaderboard, setMassMessagingLeaderboard] = useState<Array<{
    name: string;
    username: string;
    totalMessages: number;
    totalViews: number;
    totalSent: number;
    viewRate: number;
    paidMessages: number;
    freeMessages: number;
    totalRevenue: number;
    averagePrice: number;
    totalPurchases: number;
    avatar?: string;
    rank: number;
  }>>([]);
  // Fetch real VN sales and voice data
  useEffect(() => {
    const fetchVnSalesData = async () => {
      try {
        const response = await fetch("/api/vn-sales/stats");
        if (response.ok) {
          const vnStats = await response.json();
          setVnSalesData((prev) => ({
            ...prev,
            vnSalesToday: vnStats.vnSalesToday || 0,
            totalRevenue: vnStats.totalRevenue || 0,
            averageVnPrice: vnStats.averageVnPrice || 0,
            salesByModel: vnStats.salesByModel || [],
          }));
        }
      } catch (error) {
        console.error("Error fetching VN sales data:", error);
      } finally {
        setIsLoadingVnStats(false);
      }
    };

    const fetchVoiceData = async () => {
      try {
        const response = await fetch("/api/elevenlabs/total-history");
        if (response.ok) {
          const voiceStats = await response.json();
          setVnSalesData((prev) => ({
            ...prev,
            totalVnCount: voiceStats.totalVoiceGenerated || 0,
            newVnToday: voiceStats.newVoicesToday || 0,
          }));
        }
      } catch (error) {
        console.error("Error fetching voice data:", error);
      } finally {
        setIsLoadingVoiceStats(false);
      }
    };

    const fetchContentGenerationData = async () => {
      try {
        const response = await fetch("/api/content-generated/stats");
        if (response.ok) {
          const contentStats = await response.json();
          setContentGenerationData({
            totalContentGenerated: contentStats.totalContentGenerated || 0,
            contentGeneratedToday: contentStats.contentGeneratedToday || 0,
            contentGrowth: contentStats.contentGrowth || 0,
            contentByTracker: contentStats.contentByTracker || [],
          });
          setRecentActivities(contentStats.recentActivities || []);
        }
      } catch (error) {
        console.error("Error fetching content generation data:", error);
      } finally {
        setIsLoadingContentStats(false);
      }
    };

    const fetchTotalMassMessages = async () => {
      setIsLoadingMassMessages(true);
      try {
        // First get all OnlyFans accounts
        const accountsResponse = await fetch('/api/onlyfans/models?endpoint=accounts');
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          const accounts = accountsData.accounts || accountsData || [];

          let totalMessages = 0;
          const leaderboardData: Array<{
            name: string;
            username: string;
            totalMessages: number;
            totalViews: number;
            totalSent: number;
            viewRate: number;
            paidMessages: number;
            freeMessages: number;
            totalRevenue: number;
            averagePrice: number;
            totalPurchases: number;
            avatar?: string;
            rank: number;
          }> = [];

          // Fetch mass messages for each account
          for (const account of accounts) {
            try {
              const accountId = account.id || account.onlyfans_user_data?.id;
              if (accountId) {
                const messagesResponse = await fetch(`/api/onlyfans/models?accountId=${encodeURIComponent(accountId)}&endpoint=mass-messaging`);
                if (messagesResponse.ok) {
                  const messagesData = await messagesResponse.json();
                  const messages = messagesData.data?.list || messagesData.list || messagesData.data || [];
                  const messageCount = Array.isArray(messages) ? messages.length : 0;
                  totalMessages += messageCount;

                  // Calculate detailed metrics
                  let totalViews = 0;
                  let totalSent = 0;
                  let paidMessages = 0;
                  let freeMessages = 0;
                  let totalRevenue = 0;
                  let totalPurchases = 0;
                  let priceSum = 0;
                  let paidMessageCount = 0;

                  if (Array.isArray(messages)) {
                    messages.forEach((msg) => {
                      totalViews += msg.viewedCount || 0;
                      totalSent += msg.sentCount || 0;
                      totalPurchases += msg.purchasedCount || 0;

                      if (msg.isFree) {
                        freeMessages++;
                      } else {
                        paidMessages++;
                        if (msg.price) {
                          const price = parseFloat(msg.price);
                          if (!isNaN(price)) {
                            priceSum += price;
                            paidMessageCount++;
                            totalRevenue += price * (msg.purchasedCount || 0);
                          }
                        }
                      }
                    });
                  }

                  const viewRate = totalSent > 0 ? (totalViews / totalSent) * 100 : 0;
                  const averagePrice = paidMessageCount > 0 ? priceSum / paidMessageCount : 0;

                  // Add to leaderboard data
                  leaderboardData.push({
                    name: account.onlyfans_user_data?.name || account.name || 'Unknown',
                    username: account.onlyfans_user_data?.username || account.username || 'N/A',
                    totalMessages: messageCount,
                    totalViews,
                    totalSent,
                    viewRate,
                    paidMessages,
                    freeMessages,
                    totalRevenue,
                    averagePrice,
                    totalPurchases,
                    avatar: account.onlyfans_user_data?.avatar || account.avatar,
                    rank: 0, // Will be set after sorting
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching mass messages for account ${account.id}:`, error);
            }
          }

          // Sort by total revenue (primary), then view count (secondary), then view rate (tertiary)
          leaderboardData.sort((a, b) => {
            if (b.totalRevenue !== a.totalRevenue) {
              return b.totalRevenue - a.totalRevenue;
            }
            if (b.totalViews !== a.totalViews) {
              return b.totalViews - a.totalViews;
            }
            return b.viewRate - a.viewRate;
          });
          leaderboardData.forEach((item, index) => {
            item.rank = index + 1;
          });

          setTotalMassMessages(totalMessages);
          setMassMessagingLeaderboard(leaderboardData.slice(0, 5)); // Top 5
        }
      } catch (error) {
        console.error('Error fetching total mass messages:', error);
      } finally {
        setIsLoadingMassMessages(false);
      }
    };

    fetchVnSalesData();
    fetchVoiceData();
    fetchContentGenerationData();
    fetchTotalMassMessages();
  }, []);

  const vnSales = vnSalesData;

  const roleChartData = Object.entries(stats.usersByRole).map(
    ([role, count]) => ({
      name: role,
      value: count,
      color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || "#6b7280",
    })
  );

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      formattedValue: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "All registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      prefix: "",
      suffix: "",
    },
    {
      title: "VN Sales Today",
      value: vnSales.vnSalesToday,
      formattedValue: isLoadingVnStats
        ? "Loading..."
        : `$${vnSales.vnSalesToday.toLocaleString()}`,
      icon: DollarSign,
      description: isLoadingVnStats
        ? "Fetching from Google Sheets..."
        : `+${vnSales.vnSalesGrowth}% from yesterday`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      prefix: isLoadingVnStats ? "" : "$",
      suffix: "",
      isLoading: isLoadingVnStats,
    },
    {
      title: "Total VN Count",
      value: vnSales.totalVnCount,
      formattedValue: isLoadingVoiceStats
        ? "Loading..."
        : vnSales.totalVnCount.toLocaleString(),
      icon: FileText,
      description: isLoadingVoiceStats
        ? "Fetching from ElevenLabs..."
        : (
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-400">{vnSales.newVnToday} new today</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">
                {Object.keys(API_KEY_PROFILES).length} active models
              </span>
            </div>
          </div>
        ),
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      prefix: "",
      suffix: "",
      isLoading: isLoadingVoiceStats,
    },
    {
      title: "Content Generated",
      value: contentGenerationData.totalContentGenerated,
      formattedValue: isLoadingContentStats
        ? "Loading..."
        : contentGenerationData.totalContentGenerated.toLocaleString(),
      icon: FileText,
      description: isLoadingContentStats
        ? "Fetching from Google Sheets..."
        : `${contentGenerationData.contentGeneratedToday} generated today`,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      prefix: "",
      suffix: "",
      isLoading: isLoadingContentStats,
    },
    {
      title: "Conversion Rate",
      value: analytics.conversionRate,
      formattedValue: `${analytics.conversionRate}%`,
      icon: Percent,
      description: `+${analytics.conversionGrowth}% from last week`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      prefix: "",
      suffix: "%",
    },
    {
      title: "Total Revenue",
      value: vnSales.totalRevenue,
      formattedValue: isLoadingVnStats
        ? "Loading..."
        : `$${vnSales.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      description: isLoadingVnStats
        ? "Fetching from Google Sheets..."
        : `+${analytics.revenueGrowth}% from last week`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      prefix: isLoadingVnStats ? "" : "$",
      suffix: "",
      isLoading: isLoadingVnStats,
    },
    {
      title: "Loyalty Points",
      value: isLoadingVnStats
        ? 0
        : vnSalesData?.salesByModel?.reduce(
            (total: number, model: any) => total + (model.loyaltyPoints || 0),
            0
          ) || 0,
      formattedValue: isLoadingVnStats
        ? "Loading..."
        : (
            vnSalesData?.salesByModel?.reduce(
              (total: number, model: any) => total + (model.loyaltyPoints || 0),
              0
            ) || 0
          ).toLocaleString(),
      icon: Star,
      description: isLoadingVnStats
        ? "Fetching from Google Sheets..."
        : `+${vnSales.loyaltyPointsGrowth}% this week`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      prefix: "",
      suffix: "",
      isLoading: isLoadingVnStats,
    },
    {
      title: "ROI",
      value: analytics.roi,
      formattedValue: `${analytics.roi}%`,
      icon: BarChart3,
      description: `+${analytics.roiGrowth}% from last week`,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      prefix: "",
      suffix: "%",
    },
    {
      title: "Total Mass Messages",
      value: totalMassMessages,
      formattedValue: isLoadingMassMessages
        ? "Loading..."
        : totalMassMessages.toLocaleString(),
      icon: MessageCircle,
      description: "Total number of mass messages sent",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      prefix: "",
      suffix: "",
      isLoading: isLoadingMassMessages,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-300 mt-2">
          Monitor your application&apos;s performance and user activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-gray-800 border-gray-700 overflow-hidden hover:bg-gray-750 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {(stat as any).isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : (
                        <CountUp
                          end={stat.value}
                          duration={2.5}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                          decimals={
                            stat.title.includes("Rate") ||
                            stat.title.includes("ROI")
                              ? 2
                              : 0
                          }
                        />
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <div
                    className={`${stat.bgColor} p-3 rounded-full bg-opacity-20`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Activity className="h-5 w-5 text-blue-400" />
              <span>User Growth (12 Months)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ fill: "#60a5fa", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by Role Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <UserCheck className="h-5 w-5 text-green-400" />
              <span>Users by Role</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>Recent Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.slice(0, 5).map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                              alt={user.name || ""}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                          <span className="font-medium text-white">
                            {user.name || "No name"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={`
                            ${user.role === "ADMIN" ? "bg-red-900/50 text-red-200 border-red-700" : ""}
                            ${user.role === "MODERATOR" ? "bg-yellow-900/50 text-yellow-200 border-yellow-700" : ""}
                            ${user.role === "USER" ? "bg-green-900/50 text-green-200 border-green-700" : ""}
                            ${user.role === "GUEST" ? "bg-gray-700 text-gray-200 border-gray-600" : ""}
                          `}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Activity className="h-5 w-5 text-green-400" />
              <span>Recent Content Generation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingContentStats ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading recent activity...</span>
                </div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-300">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">
                        Model
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">
                        Activity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">
                        Tracker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.slice(0, 5).map((activity, index) => {
                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                {activity.image ? (
                                  <img
                                    src={`/api/image-proxy?url=${encodeURIComponent(activity.image)}`}
                                    alt={activity.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.nextSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center"
                                  style={{
                                    display: activity.image ? "none" : "flex",
                                  }}
                                >
                                  <span className="text-white text-sm font-medium">
                                    {activity.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {activity.name}
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                  {(() => {
                                    if (!activity.createdAt) return "Recently";
                                    const now = new Date();
                                    const createdTime = new Date(
                                      activity.createdAt
                                    );
                                    const diffMs =
                                      now.getTime() - createdTime.getTime();
                                    const diffSeconds = Math.floor(
                                      diffMs / 1000
                                    );
                                    const diffMinutes = Math.floor(
                                      diffSeconds / 60
                                    );
                                    const diffHours = Math.floor(
                                      diffMinutes / 60
                                    );
                                    const diffDays = Math.floor(diffHours / 24);

                                    if (diffDays > 0)
                                      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
                                    if (diffHours > 0)
                                      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
                                    if (diffMinutes > 0)
                                      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
                                    return "Just now";
                                  })()}
                                </p>
                              </div>
                              <div className="text-xs text-gray-400">
                                {activity.tracker}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            <div className="max-w-[120px] truncate">
                              {activity.model || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            Generated content
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs
                                ${activity.tracker === "VIP Gen Tracker" ? "bg-purple-900/50 text-purple-200 border-purple-700" : ""}
                                ${activity.tracker === "Live Gen Tracker" ? "bg-red-900/50 text-red-200 border-red-700" : ""}
                                ${activity.tracker === "FTT Gen Tracker" ? "bg-blue-900/50 text-blue-200 border-blue-700" : ""}
                                ${activity.tracker === "AI Gen Tracker" ? "bg-green-900/50 text-green-200 border-green-700" : ""}
                              `}
                            >
                              {activity.tracker.replace(" Gen Tracker", "")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  No recent content generation activity found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VN Sales by Model */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <DollarSign className="h-5 w-5 text-orange-400" />
              <span>VN Sales by Model</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingVnStats ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Fetching sales data from Google Sheets...</span>
                  </div>
                </div>
              ) : vnSales.salesByModel.length > 0 ? (
                <>
                  {vnSales.salesByModel.map((model, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-white">{model.name}</h3>
                        <p className="text-sm text-gray-400">
                          {model.sales} VN sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400">
                          ${model.revenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {model.loyaltyPoints} loyalty pts
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-gray-400 py-4">
                    <p className="text-sm">
                      Average VN Price:{" "}
                      <span className="text-orange-400 font-semibold">
                        ${vnSales.averageVnPrice.toFixed(2)}
                      </span>{" "}
                      (+${vnSales.priceIncrease} from last week)
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-sm">
                    No sales data found. Submit some sales to see analytics!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Generation by Tracker */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <span>Content Generation by Tracker</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingContentStats ? (
                <div className="flex justify-center py-8">
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Fetching content data from Google Sheets...</span>
                  </div>
                </div>
              ) : contentGenerationData.contentByTracker.length > 0 ? (
                <>
                  {contentGenerationData.contentByTracker.map(
                    (tracker, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium text-white">
                            {tracker.tracker}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Content generation tracker
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-400">
                            {tracker.count.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">
                            items generated
                          </p>
                        </div>
                      </div>
                    )
                  )}
                  <div className="text-center text-gray-400 py-4">
                    <p className="text-sm">
                      Total Content Generated:{" "}
                      <span className="text-purple-400 font-semibold">
                        {contentGenerationData.totalContentGenerated.toLocaleString()}                      </span>{" "}
                      (+{contentGenerationData.contentGrowth}% growth)
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-sm">
                    No content generation data found. Generate some content to
                    see analytics!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mass Messaging Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Leaderboard */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span>MM Revenue Leaders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingMassMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : massMessagingLeaderboard.length > 0 ? (
                  massMessagingLeaderboard
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 10)
                    .map((model, index) => (
                      <div key={`revenue-${model.username}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                          <img
                            src={model.avatar || "/model.png"}
                            alt={model.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-gray-400">@{model.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">${model.totalRevenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{model.totalPurchases} purchases</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No revenue data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* View Rate Leaderboard */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Eye className="h-5 w-5 text-blue-400" />
                <span>MM View Rate Leaders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingMassMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : massMessagingLeaderboard.length > 0 ? (
                  massMessagingLeaderboard
                    .filter(model => model.totalSent > 0)
                    .sort((a, b) => b.viewRate - a.viewRate)
                    .slice(0, 10)
                    .map((model, index) => (
                      <div key={`viewrate-${model.username}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                          <img
                            src={model.avatar || "/model.png"}
                            alt={model.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-gray-400">@{model.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-400">{model.viewRate.toFixed(1)}%</p>
                          <p className="text-xs text-gray-400">{model.totalViews.toLocaleString()} views</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No view rate data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Messages Leaderboard */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <MessageCircle className="h-5 w-5 text-purple-400" />
                <span>MM Volume Leaders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingMassMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : massMessagingLeaderboard.length > 0 ? (
                  massMessagingLeaderboard
                    .sort((a, b) => b.totalMessages - a.totalMessages)
                    .slice(0, 10)
                    .map((model, index) => (
                      <div key={`volume-${model.username}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                          <img
                            src={model.avatar || "/model.png"}
                            alt={model.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-gray-400">@{model.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-400">{model.totalMessages.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{model.totalSent.toLocaleString()} sent</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No volume data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Average Price Leaderboard */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                <span>MM Price Leaders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingMassMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : massMessagingLeaderboard.length > 0 ? (
                  massMessagingLeaderboard
                    .filter(model => model.averagePrice > 0)
                    .sort((a, b) => b.averagePrice - a.averagePrice)
                    .slice(0, 10)
                    .map((model, index) => (
                      <div key={`price-${model.username}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                          <img
                            src={model.avatar || "/model.png"}
                            alt={model.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-gray-400">@{model.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-400">${model.averagePrice.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{model.paidMessages} paid msgs</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No pricing data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mass Messaging Summary Stats */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span>MM Performance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMassMessages ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading summary...</span>
                </div>
              </div>
            ) : massMessagingLeaderboard.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">{totalMassMessages.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Total Messages</p>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">
                    ${massMessagingLeaderboard.reduce((sum, model) => sum + model.totalRevenue, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">
                    {massMessagingLeaderboard.reduce((sum, model) => sum + model.totalViews, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total Views</p>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">
                    {massMessagingLeaderboard.length > 0 
                      ? (massMessagingLeaderboard.reduce((sum, model) => sum + model.viewRate, 0) / massMessagingLeaderboard.length).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-400">Avg View Rate</p>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">
                    {massMessagingLeaderboard.reduce((sum, model) => sum + model.totalPurchases, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total Purchases</p>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {massMessagingLeaderboard.filter(model => model.averagePrice > 0).length > 0
                      ? (massMessagingLeaderboard
                          .filter(model => model.averagePrice > 0)
                          .reduce((sum, model) => sum + model.averagePrice, 0) / 
                        massMessagingLeaderboard.filter(model => model.averagePrice > 0).length).toFixed(2)
                      : '0.00'}
                  </p>
                  <p className="text-xs text-gray-400">Avg Price</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No mass messaging data found</p>
                <p className="text-sm">Start sending campaigns to see detailed analytics!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}