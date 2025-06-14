"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Eye,
  TrendingUp,
  Activity,
  Clock,
  Globe,
  MousePointer,
  Calendar,
  UserPlus,
  Shield,
  UserCheck,
} from "lucide-react";

interface AnalyticsData {
  uniqueVisitors: number;
  pageViews: number;
  timeRange: string;
}

interface ActivityData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ROLE_COLORS = {
  ADMIN: "#ef4444",
  MODERATOR: "#f59e0b",
  USER: "#10b981",
  GUEST: "#6b7280",
};

export function AdminDashboardClient({ userStats }: { userStats: UserStats }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [analyticsRes, activityRes, topPagesRes] = await Promise.all([
          fetch("/api/admin/analytics/visitors?timeRange=7d"),
          fetch("/api/admin/analytics/activity"),
          fetch("/api/admin/analytics/top-pages"),
        ]);

        const analyticsData = await analyticsRes.json();
        const activityDataRes = await activityRes.json();
        const topPagesData = await topPagesRes.json();

        setAnalytics(analyticsData);
        setActivityData(activityDataRes);
        setTopPages(topPagesData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const trafficData = [
    {
      name: "Authenticated Users",
      value: userStats.activeUsers7d,
      color: "#0088FE",
    },
    {
      name: "Anonymous Visitors",
      value: Math.max(
        0,
        (analytics?.uniqueVisitors || 0) - userStats.activeUsers7d,
      ),
      color: "#00C49F",
    },
  ];

  // Generate mock user growth data for the last 12 months
  const userGrowthData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      users: Math.floor(Math.random() * 50) + i * 10 + 20,
    };
  });

  // Mock recent users data
  const recentUsers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
      image: null,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "ADMIN",
      image: null,
      createdAt: new Date(),
    },
  ];

  // Mock stats for role distribution
  const stats = {
    totalUsers: userStats.totalUsers,
    totalUsersThisMonth: Math.floor(userStats.totalUsers * 0.1),
    userGrowthPercentage: 15,
    usersByRole: {
      ADMIN: Math.floor(userStats.totalUsers * 0.05),
      MODERATOR: Math.floor(userStats.totalUsers * 0.1),
      USER: Math.floor(userStats.totalUsers * 0.8),
      GUEST: Math.floor(userStats.totalUsers * 0.05),
    },
  };

  const roleChartData = Object.entries(stats.usersByRole).map(
    ([role, count]) => ({
      name: role,
      value: count,
      color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || "#6b7280",
    }),
  );

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "All registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "New This Month",
      value: stats.totalUsersThisMonth.toLocaleString(),
      icon: UserPlus,
      description: "Users joined this month",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Growth Rate",
      value: `${stats.userGrowthPercentage > 0 ? "+" : ""}${stats.userGrowthPercentage}%`,
      icon: TrendingUp,
      description: "vs last month",
      color:
        stats.userGrowthPercentage >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        stats.userGrowthPercentage >= 0
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Admin Users",
      value: (stats.usersByRole.ADMIN || 0).toLocaleString(),
      icon: Shield,
      description: "Administrative access",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-600 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      {stat.value}
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

      {/* Analytics Dashboard Section */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Analytics Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Analytics Dashboard
          </h2>
          <p className="text-gray-300">
            Comprehensive insights into user behavior and platform analytics
          </p>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Active Users (24h)
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {userStats.activeUsers24h}
                  </p>
                </div>
                <div className="bg-green-900/20 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Unique Visitors (7d)
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {analytics?.uniqueVisitors || 0}
                  </p>
                </div>
                <div className="bg-purple-900/20 p-3 rounded-full">
                  <Globe className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Page Views (7d)
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {analytics?.pageViews || 0}
                  </p>
                </div>
                <div className="bg-orange-900/20 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Active Users (30d)
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {userStats.activeUsers30d}
                  </p>
                </div>
                <div className="bg-pink-900/20 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Timeline */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Visitor Activity (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#34D399"
                    strokeWidth={2}
                    name="Unique Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                User vs Anonymous Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficData}
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
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Most Visited Pages (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topPages} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  dataKey="path"
                  type="category"
                  stroke="#9CA3AF"
                  fontSize={12}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Bar dataKey="views" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
