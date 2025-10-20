import { auth } from "@/auth";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { prisma } from "@/lib/prisma";
import { utcNowDateTime, toUtc } from "@/lib/dateUtils";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Download,
  Shield,
  UserCheck,
  User,
  Pencil,
  TrendingUp,
} from "lucide-react";


export default async function AdminUsersPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Default fallback values for when database is unavailable
  let totalUsers = 0;
  let adminCount = 0;
  let moderatorCount = 0;
  let userCount = 0;
  let swdCount = 0;
  let guestCount = 0;
  let growthRate = 0;

  try {
    // Get all users for stats (we still need total counts for the cards)
    const allUsers = await prisma.user.findMany({
      select: {
        role: true,
        createdAt: true,
      },
    });

    totalUsers = allUsers.length;
    adminCount = allUsers.filter((u) => u.role === "ADMIN").length;
    moderatorCount = allUsers.filter((u) => u.role === "MODERATOR").length;
    userCount = allUsers.filter((u) => u.role === "USER").length;
    swdCount = allUsers.filter((u) => u.role === "SWD").length;
    guestCount = allUsers.filter((u) => u.role === "GUEST").length;

    // Calculate growth metrics using UTC
    const now = utcNowDateTime();
    const lastMonth = now.minus({ months: 1 });
    const thisMonthUsers = allUsers.filter(
      (u) => toUtc(u.createdAt) >= lastMonth
    ).length;
    growthRate =
      totalUsers > 0 ? Math.round((thisMonthUsers / totalUsers) * 100) : 0;
  } catch (error) {
    console.error("Database connection error in AdminUsersPage:", error);
    // Use fallback values (already initialized above)
    // This allows the page to still render with 0 values when DB is down
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border dark:border-gray-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h1>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Manage user accounts, roles, and permissions across your platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  <TrendingUp className="h-2 w-2 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{growthRate}%
                  </span>
                </div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/30 p-2 rounded-full group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition-colors">
                <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Administrators
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {adminCount}
                </p>
                <div className="flex items-center text-xs">
                  <Shield className="h-2 w-2 text-pink-500 mr-1" />
                  <span className="text-gray-500 dark:text-gray-400">Highest</span>
                </div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/30 p-2 rounded-full group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition-colors">
                <Shield className="h-4 w-4 text-pink-500 dark:text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Moderators
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {moderatorCount}
                </p>
                <div className="flex items-center text-xs">
                  <UserCheck className="h-2 w-2 text-yellow-500 mr-1" />
                  <span className="text-gray-500 dark:text-gray-400">Content</span>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-full group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50 transition-colors">
                <UserCheck className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  SWD
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {swdCount}
                </p>
                <div className="flex items-center text-xs">
                  <Pencil className="h-2 w-2 text-purple-500 mr-1" />
                  <span className="text-gray-500 dark:text-gray-400">Writers</span>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <Pencil className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Regular Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {userCount.toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  <User className="h-2 w-2 text-green-500 mr-1" />
                  <span className="text-gray-500 dark:text-gray-400">Active</span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Guests
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {guestCount}
                </p>
                <div className="flex items-center text-xs">
                  <User className="h-2 w-2 text-gray-400 dark:text-gray-500 mr-1" />
                  <span className="text-gray-500 dark:text-gray-400">Limited</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-600/30 p-2 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-600/50 transition-colors">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Component with Tabs */}
      <AdminUsersClient
        totalUsers={totalUsers}
        sessionUserId={session.user.id}
      />
    </div>
  );
}