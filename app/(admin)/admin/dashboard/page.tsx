/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

// Error fallback component
function DatabaseErrorFallback() {
  const handleHealthCheck = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();
      
      if (data.status === 'healthy') {
        alert('Database connection is healthy. Try refreshing the page.');
        window.location.reload();
      } else {
        alert(`Database Status: ${data.database}\nError: ${data.error}`);
      }
    } catch {
      alert('Unable to check system health. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-500/30 shadow-lg">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard Temporarily Unavailable
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We&apos;re experiencing connectivity issues with our database. Please try refreshing the page in a few moments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Page
          </button>
          <button
            onClick={handleHealthCheck}
            className="inline-flex items-center px-4 py-2 border border-pink-200 dark:border-pink-500/30 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check Status
          </button>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          If the issue persists, please contact support.
        </div>
      </div>
    </div>
  );
}

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

  try {
    // Fetch dashboard statistics with error handling
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
    
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Dashboard database error:', error);
    
    // Check if it's a Prisma connection error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('connect') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('prisma')
      ) {
        // Return user-friendly error component for database connection issues
        return <DatabaseErrorFallback />;
      }
    }
    
    // For other unexpected errors, still show the error fallback
    // but log more details for investigation
    console.error('Unexpected dashboard error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return <DatabaseErrorFallback />;
  }
}