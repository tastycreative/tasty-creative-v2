
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";

export async function trackPageView(
  userId?: string,
  sessionId?: string,
  path?: string
) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "";
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown";
    
    // Hash IP for privacy
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    
    const referrer = headersList.get("referer") || "";
    const currentPath = path || "/";

    await prisma.pageView.create({
      data: {
        sessionId: sessionId || crypto.randomUUID(),
        userId,
        ipHash,
        userAgent,
        path: currentPath,
        referrer,
      },
    });

    // Update user's last accessed time if authenticated
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastAccessedAt: new Date() },
      });
    }
  } catch (error) {
    console.error("Error tracking page view:", error);
  }
}

export async function getUniqueVisitors(timeRange: "24h" | "7d" | "30d") {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const uniqueVisitors = await prisma.pageView.groupBy({
    by: ["sessionId"],
    where: {
      timestamp: {
        gte: startDate,
      },
    },
  });

  return uniqueVisitors.length;
}

export async function getPageViewStats(timeRange: "24h" | "7d" | "30d") {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const pageViews = await prisma.pageView.count({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
  });

  return pageViews;
}

export async function getUserActivityStats() {
  const activeUsers24h = await prisma.user.count({
    where: {
      lastAccessedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const activeUsers7d = await prisma.user.count({
    where: {
      lastAccessedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const activeUsers30d = await prisma.user.count({
    where: {
      lastAccessedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    activeUsers24h,
    activeUsers7d,
    activeUsers30d,
  };
}

export async function getTopPages(limit = 10) {
  const topPages = await prisma.pageView.groupBy({
    by: ["path"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit,
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
  });

  return topPages.map((page) => ({
    path: page.path,
    views: page._count.id,
  }));
}
