
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getUserActivityStats } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Get user statistics
  const totalUsers = await prisma.user.count();
  const activityStats = await getUserActivityStats();

  const userStats = {
    totalUsers,
    ...activityStats,
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Advanced Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed analytics and user behavior insights
        </p>
      </div>

      <AdminDashboardClient userStats={userStats} />
    </div>
  );
}
