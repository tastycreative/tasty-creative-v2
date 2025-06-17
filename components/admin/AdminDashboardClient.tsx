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
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  Shield,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  Star,
  BarChart3,
  Target,
  Percent,
  Loader2,
} from "lucide-react";
import CountUp from "react-countup";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalUsersThisMonth: number;
    userGrowthPercentage: number;
    usersByRole: Record<string, number>;
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
  const [contentGenerationData, setContentGenerationData] = useState(data.contentGeneration);
  const [isLoadingContentStats, setIsLoadingContentStats] = useState(true);

  // Fetch real VN sales and voice data
  useEffect(() => {
    const fetchVnSalesData = async () => {
      try {
        const response = await fetch('/api/vn-sales/stats');
        if (response.ok) {
          const vnStats = await response.json();
          setVnSalesData(prev => ({
            ...prev,
            vnSalesToday: vnStats.vnSalesToday || 0,
            totalRevenue: vnStats.totalRevenue || 0,
            averageVnPrice: vnStats.averageVnPrice || 0,
            salesByModel: vnStats.salesByModel || []
          }));
        }
      } catch (error) {
        console.error('Error fetching VN sales data:', error);
      } finally {
        setIsLoadingVnStats(false);
      }
    };

    const fetchVoiceData = async () => {
      try {
        const response = await fetch('/api/elevenlabs/total-history');
        if (response.ok) {
          const voiceStats = await response.json();
          setVnSalesData(prev => ({
            ...prev,
            totalVnCount: voiceStats.totalVoiceGenerated || 0,
            newVnToday: voiceStats.newVoicesToday || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching voice data:', error);
      } finally {
        setIsLoadingVoiceStats(false);
      }
    };

    const fetchContentGenerationData = async () => {
      try {
        const response = await fetch('/api/content-generated/stats');
        if (response.ok) {
          const contentStats = await response.json();
          setContentGenerationData({
            totalContentGenerated: contentStats.totalContentGenerated || 0,
            contentGeneratedToday: contentStats.contentGeneratedToday || 0,
            contentGrowth: contentStats.contentGrowth || 0,
            contentByTracker: contentStats.contentByTracker || []
          });
        }
      } catch (error) {
        console.error('Error fetching content generation data:', error);
      } finally {
        setIsLoadingContentStats(false);
      }
    };

    fetchVnSalesData();
    fetchVoiceData();
    fetchContentGenerationData();
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
      formattedValue: isLoadingVnStats ? "Loading..." : `$${vnSales.vnSalesToday.toLocaleString()}`,
      icon: DollarSign,
      description: isLoadingVnStats ? "Fetching from Google Sheets..." : `+${vnSales.vnSalesGrowth}% from yesterday`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      prefix: isLoadingVnStats ? "" : "$",
      suffix: "",
      isLoading: isLoadingVnStats,
    },
    {
      title: "Total VN Count",
      value: vnSales.totalVnCount,
      formattedValue: isLoadingVoiceStats ? "Loading..." : vnSales.totalVnCount.toLocaleString(),
      icon: FileText,
      description: isLoadingVoiceStats ? "Fetching from ElevenLabs..." : `${vnSales.newVnToday} new today`,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      prefix: "",
      suffix: "",
      isLoading: isLoadingVoiceStats,
    },
    {
      title: "Content Generated",
      value: contentGenerationData.totalContentGenerated,
      formattedValue: isLoadingContentStats ? "Loading..." : contentGenerationData.totalContentGenerated.toLocaleString(),
      icon: FileText,
      description: isLoadingContentStats ? "Fetching from Google Sheets..." : `${contentGenerationData.contentGeneratedToday} generated today`,
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
      formattedValue: isLoadingVnStats ? "Loading..." : `$${vnSales.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      description: isLoadingVnStats ? "Fetching from Google Sheets..." : `+${analytics.revenueGrowth}% from last week`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      prefix: isLoadingVnStats ? "" : "$",
      suffix: "",
      isLoading: isLoadingVnStats,
    },
    {
      title: "Loyalty Points",
      value: vnSales.loyaltyPointsEarned,
      formattedValue: isLoadingVnStats ? "Loading..." : vnSales.loyaltyPointsEarned.toLocaleString(),
      icon: Star,
      description: isLoadingVnStats ? "Fetching from Google Sheets..." : `+${vnSales.loyaltyPointsGrowth}% this week`,
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
                {recentUsers.map((user) => (
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
                  <p className="text-sm">No sales data found. Submit some sales to see analytics!</p>
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
                  {contentGenerationData.contentByTracker.map((tracker, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-white">{tracker.tracker}</h3>
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
                  ))}
                  <div className="text-center text-gray-400 py-4">
                    <p className="text-sm">
                      Total Content Generated:{" "}
                      <span className="text-purple-400 font-semibold">
                        {contentGenerationData.totalContentGenerated.toLocaleString()}
                      </span>{" "}
                      (+{contentGenerationData.contentGrowth}% growth)
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-sm">No content generation data found. Generate some content to see analytics!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
