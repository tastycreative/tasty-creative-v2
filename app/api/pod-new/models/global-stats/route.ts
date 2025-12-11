import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Cache for global stats - refreshes every 2 minutes
let cachedStats: {
  data: {
    totalModels: number;
    activeModels: number;
    droppedModels: number;
    totalRevenue: number;
    activePercentage: number;
  };
  timestamp: number;
} | null = null;

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow non-guest users to access global stats
    if (session.user.role === "GUEST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return cached data if still valid
    const now = Date.now();
    if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL) {
      return NextResponse.json(cachedStats.data, {
        headers: {
          'Cache-Control': 'private, max-age=120',
          'X-Cache': 'HIT',
        }
      });
    }

    // Fetch counts and guaranteed values in parallel
    // Using a single query with groupBy for active/dropped would be ideal,
    // but Prisma doesn't support conditional aggregation well on string fields
    const [totalModels, activeModels, guaranteedValues] = await Promise.all([
      prisma.clientModel.count(),

      // Use exact matching with OR for case variations (more efficient than contains)
      prisma.clientModel.count({
        where: {
          OR: [
            { status: "active" },
            { status: "Active" },
            { status: "ACTIVE" },
          ]
        }
      }),

      // Only fetch the guaranteed column for revenue calculation
      prisma.clientModel.findMany({
        select: { guaranteed: true },
        where: {
          guaranteed: { not: null },
        }
      })
    ]);

    // Calculate total guaranteed revenue
    let totalRevenue = 0;
    for (const model of guaranteedValues) {
      const guaranteedStr = model.guaranteed;
      if (!guaranteedStr || guaranteedStr.trim() === "" || guaranteedStr.trim() === "-") {
        continue;
      }
      const cleanValue = guaranteedStr.replace(/[^0-9.-]/g, "");
      const guaranteed = parseFloat(cleanValue);
      if (!isNaN(guaranteed) && guaranteed > 0) {
        totalRevenue += guaranteed;
      }
    }

    const statsData = {
      totalModels,
      activeModels,
      droppedModels: totalModels - activeModels,
      totalRevenue,
      activePercentage: totalModels > 0 ? (activeModels / totalModels) * 100 : 0,
    };

    // Update cache
    cachedStats = {
      data: statsData,
      timestamp: now,
    };

    return NextResponse.json(statsData, {
      headers: {
        'Cache-Control': 'private, max-age=120',
        'X-Cache': 'MISS',
      }
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch global stats" },
      { status: 500 }
    );
  }
}