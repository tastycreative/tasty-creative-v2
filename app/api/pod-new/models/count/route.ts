import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { referrer: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      where.status = { contains: status, mode: "insensitive" };
    }

    // Creators filter for non-admin users
    if (session.user.role !== "ADMIN" && creators.length > 0) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: creators.map((creatorName) => ({
            clientName: { contains: creatorName, mode: "insensitive" },
          })),
        },
      ];
    }

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
