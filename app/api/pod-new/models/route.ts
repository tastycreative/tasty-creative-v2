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
    const cursor = parseInt(searchParams.get("cursor") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "name";
    const creatorsParam = searchParams.get("creators") || "";

    // Parse creators filter
    const creators = creatorsParam ? creatorsParam.split(",").filter(Boolean) : [];

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
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      if (creators.length > 0) {
        // Match models based on creator names
        where.AND = [
          ...(where.AND || []),
          {
            OR: creators.map(creatorName => ({
              clientName: { contains: creatorName, mode: "insensitive" }
            }))
          }
        ];
      } else {
        // No assigned creators means no access to any models
        where.AND = [
          ...(where.AND || []),
          {
            id: "non-existent-id" // This will ensure no models are returned
          }
        ];
      }
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case "date":
        orderBy = { launchDate: "desc" };
        break;
      case "revenue":
        orderBy = { percentTaken: "desc" };
        break;
      case "name":
      default:
        orderBy = { clientName: "asc" };
        break;
    }

    // Fetch models with cursor-based pagination
    const clientModels = await prisma.clientModel.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to check if there are more
      skip: cursor,
      include: {
        contentDetails: true,
      },
    });

    // Check if there are more models
    const hasMore = clientModels.length > limit;
    const modelsToReturn = hasMore ? clientModels.slice(0, -1) : clientModels;

    // Helper function to parse comma-separated strings
    const parseCommaSeparated = (str: string | null): string[] => {
      if (!str) return [];
      return str.split(',').map(item => item.trim()).filter(item => item);
    };

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
      profile: model.profileLink || '', // Add profile field for image component compatibility
      // Additional fields for compatibility
      percentTaken: model.percentTaken,
      guaranteed: model.guaranteed,
      notes: model.notes,
      generalNotes: model.generalNotes,
      restrictedTermsEmojis: model.restrictedTermsEmojis,
      profileLink: model.profileLink,
    }));

    // Get total count for UI display
    const total = await prisma.clientModel.count({ where });

    return NextResponse.json({
      models: transformedModels,
      nextCursor: hasMore ? cursor + limit : null,
      hasMore,
      total,
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

