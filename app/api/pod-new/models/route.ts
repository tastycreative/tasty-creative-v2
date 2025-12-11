import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper to build status filter with exact matching (faster than contains)
function buildStatusFilter(status: string) {
  if (status === "all") return undefined;

  // Match common case variations
  const statusLower = status.toLowerCase();
  if (statusLower === "active") {
    return { OR: [{ status: "active" }, { status: "Active" }, { status: "ACTIVE" }] };
  }
  if (statusLower === "dropped") {
    return { OR: [{ status: "dropped" }, { status: "Dropped" }, { status: "DROPPED" }] };
  }
  // Fallback for other statuses
  return { status: { equals: status, mode: "insensitive" as const } };
}

// Helper function to parse comma-separated strings
const parseCommaSeparated = (str: string | null): string[] => {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item);
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = parseInt(searchParams.get("cursor") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "name";
    const creatorsParam = searchParams.get("creators") || "";
    const includeStats = searchParams.get("includeStats") === "true";

    // Parse creators filter
    const creators = creatorsParam ? creatorsParam.split(",").filter(Boolean) : [];

    // Build where clause
    const whereConditions: any[] = [];

    // Search filter - use a single OR clause
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
        // Use exact matching for creator names (much faster than contains)
        whereConditions.push({
          clientName: { in: creators }
        });
      } else {
        // No assigned creators - return empty result early
        return NextResponse.json({
          models: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
          stats: includeStats ? { total: 0, active: 0, dropped: 0 } : undefined,
        });
      }
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case "date":
        orderBy = { launchDate: "desc" };
        break;
      case "revenue":
        orderBy = { guaranteed: "desc" };
        break;
      case "name":
      default:
        orderBy = { clientName: "asc" };
        break;
    }

    // Run queries in parallel for better performance
    const [clientModels, total] = await Promise.all([
      // Fetch models with cursor-based pagination
      prisma.clientModel.findMany({
        where,
        orderBy,
        take: limit + 1, // Fetch one extra to check if there are more
        skip: cursor,
        select: {
          id: true,
          clientName: true,
          status: true,
          launchDate: true,
          referrer: true,
          personalityType: true,
          commonTerms: true,
          commonEmojis: true,
          mainInstagram: true,
          mainTwitter: true,
          mainTiktok: true,
          generalNotes: true,
          profileLink: true,
          percentTaken: true,
          guaranteed: true,
          notes: true,
          restrictedTermsEmojis: true,
        },
      }),
      // Get total count
      prisma.clientModel.count({ where }),
    ]);

    // Check if there are more models
    const hasMore = clientModels.length > limit;
    const modelsToReturn = hasMore ? clientModels.slice(0, -1) : clientModels;

    // Transform database models to match ModelDetails interface
    const transformedModels: ModelDetails[] = modelsToReturn.map(model => ({
      id: model.id,
      name: model.clientName,
      status: (model.status?.toLowerCase() === 'active' ? 'active' : 'dropped') as 'active' | 'dropped',
      launchDate: model.launchDate || '',
      referrerName: model.referrer || '',
      personalityType: model.personalityType || '',
      commonTerms: parseCommaSeparated(model.commonTerms),
      commonEmojis: parseCommaSeparated(model.commonEmojis),
      instagram: model.mainInstagram || undefined,
      twitter: model.mainTwitter || undefined,
      tiktok: model.mainTiktok || undefined,
      chattingManagers: parseCommaSeparated(model.generalNotes),
      profileImage: model.profileLink || undefined,
      profile: model.profileLink || '',
      percentTaken: model.percentTaken,
      guaranteed: model.guaranteed,
      notes: model.notes,
      generalNotes: model.generalNotes,
      restrictedTermsEmojis: model.restrictedTermsEmojis,
      profileLink: model.profileLink,
    }));

    // Optionally include inline stats to reduce API calls
    let stats = undefined;
    if (includeStats) {
      // Calculate stats from the fetched data when possible, or query if needed
      const activeCount = cursor === 0 && !hasMore
        ? transformedModels.filter(m => m.status === 'active').length
        : await prisma.clientModel.count({
            where: {
              ...where,
              OR: [{ status: "active" }, { status: "Active" }, { status: "ACTIVE" }],
            },
          });

      stats = {
        total,
        active: activeCount,
        dropped: total - activeCount,
      };
    }

    return NextResponse.json({
      models: transformedModels,
      nextCursor: hasMore ? cursor + limit : null,
      hasMore,
      total,
      stats,
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

