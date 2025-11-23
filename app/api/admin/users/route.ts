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
    const activityPeriod = searchParams.get("activityPeriod") || "monthly";

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

      // Calculate date range based on period
      let startDate = new Date(today);
      const endDate = new Date(today);

      switch (activityPeriod) {
        case "weekly":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "monthly":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "3months":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "9months":
          startDate.setMonth(startDate.getMonth() - 9);
          break;
        case "12months":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "alltime":
          // Get the earliest user creation date
          const earliestUser = await prisma.user.findFirst({
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          });
          startDate = earliestUser ? new Date(earliestUser.createdAt) : startDate;
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

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

      // Calculate real-time unique user counts for week and month
      const [activeWeekUsers, activeMonthUsers] = await Promise.all([
        // Unique users active in last 7 days
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT u.id)::bigint as count
          FROM "User" u
          LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
          WHERE COALESCE(a.last_accessed, u."lastAccessedAt", u."updatedAt", u."createdAt") >= ${weekAgo}
        `,
        // Unique users active in last 30 days
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT u.id)::bigint as count
          FROM "User" u
          LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
          WHERE COALESCE(a.last_accessed, u."lastAccessedAt", u."updatedAt", u."createdAt") >= ${monthAgo}
        `,
      ]);

      const activeThisWeek = Number(activeWeekUsers[0]?.count || 0);
      const activeThisMonth = Number(activeMonthUsers[0]?.count || 0);

      // Format daily activity data
      const formattedDailyActivity = dailyActivity.map(item => {
        const itemDate = item.date.toISOString().split('T')[0];
        const todayDate = today.toISOString().split('T')[0];

        // Use real-time count for today, stored stats for historical dates
        const count = itemDate === todayDate ? activeToday : Number(item.count);

        return {
          date: itemDate,
          count,
        };
      });

      // If today's date is not in the daily activity data, add it with real-time count
      const todayDate = today.toISOString().split('T')[0];
      const hasTodayData = formattedDailyActivity.some(item => item.date === todayDate);

      if (!hasTodayData && activeToday > 0) {
        formattedDailyActivity.unshift({
          date: todayDate,
          count: activeToday,
        });
      }

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