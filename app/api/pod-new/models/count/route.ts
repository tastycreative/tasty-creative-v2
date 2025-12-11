import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper to build status filter with exact matching (faster than contains)
function buildStatusFilter(status: string) {
  if (status === "all") return undefined;

  const statusLower = status.toLowerCase();
  if (statusLower === "active") {
    return { OR: [{ status: "active" }, { status: "Active" }, { status: "ACTIVE" }] };
  }
  if (statusLower === "dropped") {
    return { OR: [{ status: "dropped" }, { status: "Dropped" }, { status: "DROPPED" }] };
  }
  return { status: { equals: status, mode: "insensitive" as const } };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const creatorsParam = searchParams.get("creators") || "";

    // Parse creators filter
    const creators = creatorsParam
      ? creatorsParam.split(",").filter(Boolean)
      : [];

    // Build where clause with array of conditions
    const whereConditions: any[] = [];

    // Search filter
    if (search) {
      whereConditions.push({
        OR: [
          { clientName: { contains: search, mode: "insensitive" } },
          { referrer: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Status filter with exact matching
    const statusFilter = buildStatusFilter(status);
    if (statusFilter) {
      whereConditions.push(statusFilter);
    }

    // Creators filter for non-admin users
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      if (creators.length > 0) {
        // Use exact matching for creator names
        whereConditions.push({
          clientName: { in: creators }
        });
      } else {
        // No assigned creators - return 0 early
        return NextResponse.json({ count: 0 });
      }
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
    const count = await prisma.clientModel.count({ where });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching models count:", error);
    return NextResponse.json(
      { error: "Failed to fetch models count" },
      { status: 500 }
    );
  }
}
