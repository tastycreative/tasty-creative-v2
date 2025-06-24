import { auth } from "@/auth";
import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { BulkRoleEditor } from "@/components/admin/BulkRoleEditor";
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
  Pencil,
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
  const swdCount = users.filter((u) => u.role === "SWD").length;
  const guestCount = users.filter((u) => u.role === "GUEST").length;

  // Calculate growth metrics
  const thisMonth = new Date();
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1);
  const thisMonthUsers = users.filter(
    (u) => new Date(u.createdAt) >= lastMonth
  ).length;
  const growthRate =
    totalUsers > 0 ? Math.round((thisMonthUsers / totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <Users className="h-6 w-6 text-pink-500" />
            </div>
            <p className="text-gray-600">
              Manage user accounts, roles, and permissions across your platform
            </p>
          </div>
          <div className="flex gap-3">
            <BulkRoleEditor users={users} />
            <button className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  <TrendingUp className="h-2 w-2 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{growthRate}%
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Administrators
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {adminCount}
                </p>
                <div className="flex items-center text-xs">
                  <Shield className="h-2 w-2 text-pink-500 mr-1" />
                  <span className="text-gray-500">Highest</span>
                </div>
              </div>
              <div className="bg-pink-50 p-2 rounded-full group-hover:bg-pink-100 transition-colors">
                <Shield className="h-4 w-4 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Moderators
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {moderatorCount}
                </p>
                <div className="flex items-center text-xs">
                  <UserCheck className="h-2 w-2 text-yellow-500 mr-1" />
                  <span className="text-gray-500">Content</span>
                </div>
              </div>
              <div className="bg-yellow-50 p-2 rounded-full group-hover:bg-yellow-100 transition-colors">
                <UserCheck className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  SWD
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {swdCount}
                </p>
                <div className="flex items-center text-xs">
                  <Pencil className="h-2 w-2 text-purple-500 mr-1" />
                  <span className="text-gray-500">Writers</span>
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded-full group-hover:bg-purple-100 transition-colors">
                <Pencil className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Regular Users
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {userCount.toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  <User className="h-2 w-2 text-green-500 mr-1" />
                  <span className="text-gray-500">Active</span>
                </div>
              </div>
              <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-100 transition-colors">
                <User className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Guests
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {guestCount}
                </p>
                <div className="flex items-center text-xs">
                  <User className="h-2 w-2 text-gray-400 mr-1" />
                  <span className="text-gray-500">Limited</span>
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                <User className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filter Bar */}
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <Filter className="h-4 w-4 mr-2" />
                Filter by Role
              </button>
              <button className="inline-flex items-center px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Users Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 font-bold flex items-center">
              <Eye className="h-5 w-5 mr-2 text-pink-500" />
              All Users ({totalUsers})
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role & Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Account Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-pink-50 transition-all duration-300 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-gray-200 group-hover:border-pink-300 transition-all duration-300"
                            src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                            alt={user.name || ""}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mr-4 group-hover:from-pink-100 group-hover:to-pink-200 transition-all duration-300">
                            <User className="h-6 w-6 text-gray-500 group-hover:text-pink-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-pink-700 transition-colors">
                            {user.name || "No name"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
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
                              ? "bg-black text-white border-black hover:bg-gray-800"
                              : user.role === "MODERATOR"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                                : user.role === "SWD"
                                  ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                                  : user.role === "USER"
                                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                    : user.role === "GUEST"
                                      ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }
                        `}
                      >
                        {user.role === "ADMIN" && (
                          <Shield className="h-3 w-3 mr-1 inline" />
                        )}
                        {user.role === "MODERATOR" && (
                          <UserCheck className="h-3 w-3 mr-1 inline" />
                        )}
                        {user.role === "SWD" && (
                          <Pencil className="h-3 w-3 mr-1 inline" />
                        )}
                        {(user.role === "USER" || user.role === "GUEST") && (
                          <User className="h-3 w-3 mr-1 inline" />
                        )}
                        {user.role === "SWD" ? "Script Writer" : user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
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
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110">
                          <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}