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

    // Get client's date components to reconstruct "today" in their timezone
    const clientTimezone = searchParams.get("timezone");
    const clientYear = searchParams.get("year");
    const clientMonth = searchParams.get("month");
    const clientDate = searchParams.get("date");

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
              last_refreshed: true, // Added to force new query plan after schema change
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
      // Use UTC "today" for consistency across all users
      const now = new Date();
      const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const today = utcNow;
      const tomorrow = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate() + 1
      ));

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
      // Exclude today since we'll use real-time count instead
      // today is already UTC, so we can use it directly
      const dailyActivityStats = await prisma.dailyActivityStat.findMany({
        where: {
          date: {
            gte: startDate,
            lt: today, // Get all historical data before today (UTC)
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
      // Use client's timezone window (today to tomorrow) for accurate filtering
      // Cast to timestamptz to handle both timestamp and timestamptz columns
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
          COALESCE(a.last_accessed::timestamptz, u."lastAccessedAt"::timestamptz, u."updatedAt"::timestamptz, u."createdAt"::timestamptz) as "lastAccessed"
        FROM "User" u
        LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
        WHERE COALESCE(a.last_accessed::timestamptz, u."lastAccessedAt"::timestamptz, u."updatedAt"::timestamptz, u."createdAt"::timestamptz) >= ${today}::timestamptz
          AND COALESCE(a.last_accessed::timestamptz, u."lastAccessedAt"::timestamptz, u."updatedAt"::timestamptz, u."createdAt"::timestamptz) < ${tomorrow}::timestamptz
        ORDER BY "lastAccessed" DESC
      `;

      const activeToday = activeTodayUsers.length;

      // Calculate real-time unique user counts for week and month
      // Cast to timestamptz to handle both timestamp and timestamptz columns
      const [activeWeekUsers, activeMonthUsers] = await Promise.all([
        // Unique users active in last 7 days
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT u.id)::bigint as count
          FROM "User" u
          LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
          WHERE COALESCE(a.last_accessed::timestamptz, u."lastAccessedAt"::timestamptz, u."updatedAt"::timestamptz, u."createdAt"::timestamptz) >= ${weekAgo}::timestamptz
        `,
        // Unique users active in last 30 days
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT u.id)::bigint as count
          FROM "User" u
          LEFT JOIN "Account" a ON a."userId" = u.id AND a.provider = 'google'
          WHERE COALESCE(a.last_accessed::timestamptz, u."lastAccessedAt"::timestamptz, u."updatedAt"::timestamptz, u."createdAt"::timestamptz) >= ${monthAgo}::timestamptz
        `,
      ]);

      const activeThisWeek = Number(activeWeekUsers[0]?.count || 0);
      const activeThisMonth = Number(activeMonthUsers[0]?.count || 0);

      // Format daily activity data
      // Send all dates as UTC date strings - no timezone conversion
      const formattedDailyActivity = dailyActivity.map(item => ({
        date: item.date.toISOString().split('T')[0], // UTC date string (YYYY-MM-DD)
        count: Number(item.count),
      }));

      // Add real-time "today" count using UTC today
      formattedDailyActivity.unshift({
        date: today.toISOString().split('T')[0], // UTC date string
        count: activeToday,
      });

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