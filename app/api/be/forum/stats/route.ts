// src/app/api/be/forum/stats/route.ts
import { ForumStats } from "../../../../lib/forum-api";

export async function GET(request: Request) {
  try {
    // Mock forum stats data matching the ForumStats interface
    const mockStats: ForumStats = {
      totalUsers: 1247,
      totalPosts: 3892,
      totalComments: 15640,
      todayPosts: 23,
      activeUsers: 156,
    };

    return Response.json(mockStats);
  } catch (err) {
    console.error("Forum stats error:", err);
    return new Response("Failed to retrieve forum stats", { status: 500 });
  }
}
