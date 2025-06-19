/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Note: We'll fetch this data on the client side to show loading states
  // Static data for server-side rendering, real data fetched client-side
  const vnSalesStats: any = null;
  const voiceStats: any = null;

  // Fetch dashboard statistics
  const [
    totalUsers,
    totalUsersThisMonth,
    totalUsersLastMonth,
    usersByRole,
    recentUsers,
    userGrowthData,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Users this month
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // Users last month
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // Users by role
    prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    }),

    // Recent users
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),

    // User growth data (last 12 months)
    Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        });

        return {
          month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: count,
        };
      })
    ).then(data => data.reverse()),
  ]);

  const userGrowthPercentage = totalUsersLastMonth > 0 
    ? ((totalUsersThisMonth - totalUsersLastMonth) / totalUsersLastMonth) * 100 
    : 0;

  // Real VN Sales data from Google Sheets and ElevenLabs
  const vnSalesData = {
    vnSalesToday: vnSalesStats?.vnSalesToday || 0,
    vnSalesGrowth: 0, // Calculate growth later if needed
    totalVnCount: voiceStats?.totalVoiceGenerated || 0,
    newVnToday: voiceStats?.newVoicesToday || 0,
    loyaltyPointsEarned: vnSalesStats?.salesByModel?.reduce((total: number, model: any) => total + model.loyaltyPoints, 0) || 0,
    loyaltyPointsGrowth: 0, // Calculate growth later if needed
    averageVnPrice: vnSalesStats?.averageVnPrice || 0,
    priceIncrease: 0, // Calculate price change later if needed
    totalRevenue: vnSalesStats?.totalRevenue || 0,
    salesByModel: vnSalesStats?.salesByModel || []
  };

  // Mock Analytics data (replace with actual database queries)
  const analyticsData = {
    activeCampaigns: 12,
    newCampaignsThisWeek: 3,
    conversionRate: 0,
    conversionGrowth: 0.5,
    totalRevenue: 0,
    revenueGrowth: 0,
    roi: 0,
    roiGrowth: 0,
  };

  // Content Generation data placeholder (will be fetched client-side)
  const contentGenerationData = {
    totalContentGenerated: 0,
    contentGeneratedToday: 0,
    contentGrowth: 0,
    contentByTracker: []
  };

  const dashboardData = {
    stats: {
      totalUsers,
      totalUsersThisMonth,
      userGrowthPercentage: Math.round(userGrowthPercentage * 100) / 100,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
    },
    recentUsers,
    userGrowthData,
    vnSales: vnSalesData,
    analytics: analyticsData,
    contentGeneration: contentGenerationData,
  };

  return <AdminDashboardClient data={dashboardData} />;
}