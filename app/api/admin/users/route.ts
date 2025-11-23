import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is admin or moderator
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const activityStartDate = searchParams.get("activityStartDate");
    const activityEndDate = searchParams.get("activityEndDate");

    // Validate pagination parameters
    const pageSize = limit === "all" ? undefined : parseInt(limit || "10");
    const offset = pageSize ? (page - 1) * pageSize : 0;

    // Build where clause for filtering
    const where: any = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter;
    }

    try {
      // Get total count for pagination
      const totalUsers = await prisma.user.count({ where });

      // Fetch users with pagination
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          createdAt: true,
          emailVerified: true,
          lastAccessedAt: true,
          accounts: {
            select: {
              last_accessed: true,
            },
            where: {
              provider: "google",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: pageSize,
      });

      // Transform users to include last_accessed from account
      const usersWithLastAccess = users.map(user => ({
        ...user,
        lastAccessedAt: user.accounts[0]?.last_accessed || user.lastAccessedAt || null,
        accounts: undefined, // Remove accounts from response
      }));

      // Calculate activity statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Use custom date range or default to last 30 days
      const startDate = activityStartDate ? new Date(activityStartDate) : monthAgo;
      const endDate = activityEndDate ? new Date(activityEndDate) : today;

      // Get daily activity counts from DailyActivityStat table
      const dailyActivityStats = await prisma.dailyActivityStat.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
          activeUsers: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Transform to match expected format
      const dailyActivity = dailyActivityStats.map(stat => ({
        date: stat.date,
        count: BigInt(stat.activeUsers),
      }));

      // Calculate period-based stats for the selected range
      const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const oneThirdPoint = new Date(startDate.getTime() + (rangeDays / 3) * 24 * 60 * 60 * 1000);
      const twoThirdsPoint = new Date(startDate.getTime() + ((rangeDays * 2) / 3) * 24 * 60 * 60 * 1000);

      // Get users who accessed today with their details
      const activeTodayUsers = await prisma.$queryRaw<Array<{
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        lastAccessed: Date;
      }>>`
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.image,
          COALESCE(a.last_accessed, u."lastAccessedAt", u."updatedAt", u."createdAt") as "lastAccessed"
        FROM "User" u
        LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
        WHERE COALESCE(a.last_accessed, u."lastAccessedAt", u."updatedAt", u."createdAt") >= ${today}
        ORDER BY "lastAccessed" DESC
      `;

      const activeToday = activeTodayUsers.length;

      // Calculate week and month stats from DailyActivityStat table
      const [weekStats, monthStats] = await Promise.all([
        // Last 7 days
        prisma.dailyActivityStat.findMany({
          where: {
            date: {
              gte: weekAgo,
            },
          },
          select: {
            activeUsers: true,
          },
        }),
        // Last 30 days
        prisma.dailyActivityStat.findMany({
          where: {
            date: {
              gte: monthAgo,
            },
          },
          select: {
            activeUsers: true,
          },
        }),
      ]);

      // Sum up unique active users (use max to avoid double counting)
      const activeThisWeek = Math.max(...weekStats.map(s => s.activeUsers), 0);
      const activeThisMonth = Math.max(...monthStats.map(s => s.activeUsers), 0);

      // Format daily activity data
      const formattedDailyActivity = dailyActivity.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: Number(item.count),
      }));

      // Calculate pagination info
      const totalPages = pageSize ? Math.ceil(totalUsers / pageSize) : 1;
      const hasNextPage = pageSize ? page < totalPages : false;
      const hasPrevPage = page > 1;

      return NextResponse.json({
        success: true,
        users: usersWithLastAccess,
        pagination: {
          page,
          limit: limit || "10",
          totalUsers,
          totalPages,
          hasNextPage,
          hasPrevPage,
          showing: users.length,
        },
        activity: {
          daily: formattedDailyActivity,
          activeToday,
          activeThisWeek,
          activeThisMonth,
          activeTodayUsers: activeTodayUsers.map(user => ({
            ...user,
            lastAccessed: user.lastAccessed.toISOString(),
          })),
        }
      });
    } catch (dbError) {
      console.error("Database connection error in users API:", dbError);
      
      // Return fallback response when database is unavailable
      return NextResponse.json({ 
        success: true,
        users: [], // Empty array when DB is down
        pagination: {
          page,
          limit: limit || "10",
          totalUsers: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          showing: 0,
        },
        error: "Database temporarily unavailable. Please try again later.",
      });
    }

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}