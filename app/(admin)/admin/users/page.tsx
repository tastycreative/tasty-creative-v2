import { auth } from "@/auth";
import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Filter, Download, UserPlus } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-300">
              Manage user accounts and permissions across your platform
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
                <div className="bg-blue-900/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Administrators
                  </p>
                  <p className="text-2xl font-bold text-white">{adminCount}</p>
                </div>
                <div className="bg-red-900/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Moderators
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {moderatorCount}
                  </p>
                </div>
                <div className="bg-yellow-900/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Regular Users
                  </p>
                  <p className="text-2xl font-bold text-white">{userCount}</p>
                </div>
                <div className="bg-green-900/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Users ({totalUsers})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="h-10 w-10 rounded-full object-cover mr-4"
                              src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                              alt={user.name || ""}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center mr-4">
                              <Users className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-gray-400">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`
                            font-medium
                            ${
                              user.role === "ADMIN"
                                ? "bg-red-900/50 text-red-200 border-red-700"
                                : user.role === "MODERATOR"
                                  ? "bg-yellow-900/50 text-yellow-200 border-yellow-700"
                                  : user.role === "USER"
                                    ? "bg-green-900/50 text-green-200 border-green-700"
                                    : "bg-gray-700 text-gray-200 border-gray-600"
                            }
                          `}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <UserRoleForm
                          userId={user.id}
                          currentRole={user.role as Role}
                          userName={user.name || user.email || "User"}
                          isCurrentUser={user.id === session.user.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}