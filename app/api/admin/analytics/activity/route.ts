
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get daily activity for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyActivity = await prisma.pageView.groupBy({
      by: ["timestamp"],
      _count: {
        id: true,
        sessionId: true,
      },
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Group by date
    const activityByDate = dailyActivity.reduce((acc: Record<string, any>, curr) => {
      const date = curr.timestamp.toISOString().split("T")[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          pageViews: 0,
          uniqueVisitors: new Set(),
        };
      }
      
      acc[date].pageViews += curr._count.id;
      
      return acc;
    }, {});

    // Convert to array and calculate unique visitors per day
    const activityData = Object.values(activityByDate).map((day: any) => ({
      date: day.date,
      pageViews: day.pageViews,
      uniqueVisitors: day.uniqueVisitors.size,
    }));

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching activity analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity analytics" },
      { status: 500 }
    );
  }
}
