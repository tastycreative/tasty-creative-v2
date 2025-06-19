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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage user accounts and permissions across your platform
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-colors shadow-sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalUsers}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Administrators
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminCount}
                  </p>
                </div>
                <div className="bg-pink-50 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Moderators
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moderatorCount}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Regular Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userCount}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-bold">
              All Users ({totalUsers})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Join Date
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
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="h-10 w-10 rounded-full object-cover mr-4 border-2 border-gray-200"
                              src={`/api/image-proxy?url=${encodeURIComponent(user.image)}`}
                              alt={user.name || ""}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`
                            font-medium border
                            ${
                              user.role === "ADMIN"
                                ? "bg-black text-white border-black"
                                : user.role === "MODERATOR"
                                  ? "bg-gray-100 text-gray-700 border-gray-300"
                                  : user.role === "USER"
                                    ? "bg-white text-gray-600 border-gray-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                            }
                          `}
                        >
                          {user.role === "ADMIN" && (
                            <Shield className="h-3 w-3 mr-1 inline text-pink-400" />
                          )}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
