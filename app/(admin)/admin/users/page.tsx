
import { auth } from "@/auth";
import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Filter,
  Download,
  Shield,
  UserCheck,
  User,
  Calendar,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Clock,
  ArrowLeft,
} from "lucide-react";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
};

export default async function AdminUsersPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Fetch all users
  const users: User[] = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const moderatorCount = users.filter((u) => u.role === "MODERATOR").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  // Calculate growth metrics
  const thisMonth = new Date();
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1);
  const thisMonthUsers = users.filter(
    (u) => new Date(u.createdAt) >= lastMonth
  ).length;
  const growthRate =
    totalUsers > 0 ? Math.round((thisMonthUsers / totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-80 w-80 h-80 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl animate-pulse" />
        <div className="absolute top-80 -left-80 w-80 h-80 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mb-6 group flex items-center gap-2 text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Admin</span>
        </button>

        {/* Main Content */}
        <div className="relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />
          
          <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-8 border-b border-slate-700/30 bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-purple-600/10">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                      User Management
                    </h1>
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm">
                      <Users className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-lg">
                    Manage user accounts, roles, and permissions across your platform
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium transition-all backdrop-blur-sm border border-slate-600/30 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 inline-flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="p-8 border-b border-slate-700/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 hover:border-blue-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">
                          Total Users
                        </p>
                        <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                          {totalUsers.toLocaleString()}
                        </p>
                        <div className="flex items-center text-sm">
                          <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                          <span className="text-green-400 font-medium">
                            +{growthRate}%
                          </span>
                          <span className="text-gray-500 ml-1">this month</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 hover:border-purple-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">
                          Administrators
                        </p>
                        <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                          {adminCount}
                        </p>
                        <div className="flex items-center text-sm">
                          <Shield className="h-3 w-3 text-purple-400 mr-1" />
                          <span className="text-gray-400">Highest privilege</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 hover:border-yellow-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">
                          Moderators
                        </p>
                        <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                          {moderatorCount}
                        </p>
                        <div className="flex items-center text-sm">
                          <UserCheck className="h-3 w-3 text-yellow-400 mr-1" />
                          <span className="text-gray-400">Content managers</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
                        <UserCheck className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 hover:border-green-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">
                          Regular Users
                        </p>
                        <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                          {userCount.toLocaleString()}
                        </p>
                        <div className="flex items-center text-sm">
                          <User className="h-3 w-3 text-green-400 mr-1" />
                          <span className="text-gray-400">Active members</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                        <User className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-8 border-b border-slate-700/30">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    className="w-full pl-12 pr-6 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium transition-all backdrop-blur-sm border border-slate-600/30 hover:border-purple-500/30 inline-flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter by Role
                  </button>
                  <button className="px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl font-medium transition-all backdrop-blur-sm border border-slate-600/30 hover:border-purple-500/30 inline-flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Date Range
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    All Users ({totalUsers})
                  </h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/20 to-slate-700/20 rounded-2xl blur-xl" />
                <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/30 border-b border-slate-600/30">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            User Details
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            Role & Permissions
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            Account Info
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/30">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-700/30 transition-all duration-300 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-slate-600 group-hover:border-purple-400 transition-all duration-300"
                                    src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                                    alt={user.name || ""}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center mr-4 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all duration-300 border border-slate-600 group-hover:border-purple-400">
                                    <User className="h-6 w-6 text-gray-400 group-hover:text-purple-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">
                                    {user.name || "No name"}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono">
                                    ID: {user.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                Verified Account
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="secondary"
                                className={`
                                  font-medium border transition-all duration-300 hover:scale-105
                                  ${
                                    user.role === "ADMIN"
                                      ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-200 border-purple-500/30 hover:border-purple-400"
                                      : user.role === "MODERATOR"
                                        ? "bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-200 border-yellow-500/30 hover:border-yellow-400"
                                        : user.role === "USER"
                                          ? "bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-200 border-green-500/30 hover:border-green-400"
                                          : "bg-slate-700/30 text-gray-300 border-slate-600/30 hover:border-slate-500"
                                  }
                                `}
                              >
                                {user.role === "ADMIN" && (
                                  <Shield className="h-3 w-3 mr-1 inline" />
                                )}
                                {user.role === "MODERATOR" && (
                                  <UserCheck className="h-3 w-3 mr-1 inline" />
                                )}
                                {user.role === "USER" && (
                                  <User className="h-3 w-3 mr-1 inline" />
                                )}
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white font-medium">
                                {new Date(user.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString("en-US", {
                                  weekday: "long",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <UserRoleForm
                                  userId={user.id}
                                  currentRole={user.role as Role}
                                  userName={user.name || user.email || "User"}
                                  isCurrentUser={user.id === session.user.id}
                                />
                                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-300 hover:scale-110">
                                  <MoreHorizontal className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
