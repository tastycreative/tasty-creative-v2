import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models/[modelId]/forum/stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { modelId } = await params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get forum statistics
    const [totalThreads, todayThreads, totalPosts, uniqueAuthors] = await Promise.all([
      // Total threads for this model
      prisma.thread.count({
        where: { modelId },
      }),

      // Today's threads
      prisma.thread.count({
        where: {
          modelId,
          createdAt: {
            gte: today,
          },
        },
      }),

      // Total posts in threads for this model
      prisma.post.count({
        where: {
          Thread: {
            modelId,
          },
        },
      }),

      // Unique authors (approximate active users)
      prisma.thread.findMany({
        where: { modelId },
        select: { authorId: true },
        distinct: ['authorId'],
      }),
    ]);

    const stats = {
      totalThreads,
      todayThreads,
      activeUsers: uniqueAuthors.length,
      totalPosts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching forum stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}