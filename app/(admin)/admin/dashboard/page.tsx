import { auth } from "@/auth";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getUserActivityStats } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
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

  return <AdminDashboardClient userStats={userStats} />;
}