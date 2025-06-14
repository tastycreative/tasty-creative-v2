
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUniqueVisitors, getPageViewStats } from "@/lib/analytics";

export async function GET(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("timeRange") as "24h" | "7d" | "30d") || "7d";

    const uniqueVisitors = await getUniqueVisitors(timeRange);
    const pageViews = await getPageViewStats(timeRange);

    return NextResponse.json({
      uniqueVisitors,
      pageViews,
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching visitor analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
