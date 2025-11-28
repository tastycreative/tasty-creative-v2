import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper function to convert Google Drive links to direct image URLs
const convertGoogleDriveLink = (url: string | null): string | null => {
  if (!url) return null;

  // Check if it's a Google Drive link
  if (url.includes('drive.google.com')) {
    try {
      // Try to extract file ID from /file/d/ pattern
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      let driveId: string | null = null;

      if (fileMatch && fileMatch[1]) {
        driveId = fileMatch[1];
      } else {
        // Try to extract from URL parameters
        const urlObj = new URL(url);
        driveId = urlObj.searchParams.get('id');
      }

      if (driveId) {
        // Use thumbnail endpoint like EnhancedModelCard (more reliable)
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
      }
    } catch (e) {
      // If URL parsing fails, return original
      return url;
    }
  }

  // Return as-is if not a Google Drive link (regular image URLs, etc.)
  return url;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creator = searchParams.get("creator");
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");
    const flyerLink = searchParams.get("flyerLink");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    // Build filter conditions
    const where: any = {};

    // By default, filter out deleted events unless explicitly requested
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Search across title, description, creator name, and tags
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          title: {
            contains: searchLower,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchLower,
            mode: 'insensitive',
          },
        },
        {
          creator: {
            clientName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        },
        {
          tags: {
            hasSome: [searchLower],
          },
        },
      ];
    }

    if (creator && creator !== "all") {
      // Find the creator by clientName
      const clientModel = await prisma.clientModel.findUnique({
        where: { clientName: creator },
        select: { id: true },
      });
      if (clientModel) {
        where.creatorId = clientModel.id;
      }
    }

    if (eventType && eventType !== "all") {
      where.type = eventType;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (flyerLink && flyerLink !== "all") {
      if (flyerLink === "has") {
        where.flyerLink = {
          not: null,
        };
      } else if (flyerLink === "no") {
        where.flyerLink = null;
      }
    }

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    const events = await prisma.contentEvent.findMany({
      where,
      include: {
        creator: {
          select: {
            clientName: true,
            profileLink: true,
            profilePicture: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Transform events to convert Google Drive links and use profileLink as primary source
    const transformedEvents = events.map(event => ({
      ...event,
      creator: event.creator ? {
        ...event.creator,
        profilePicture: convertGoogleDriveLink(event.creator.profileLink) || convertGoogleDriveLink(event.creator.profilePicture) || null,
      } : null,
    }));

    return NextResponse.json({ events: transformedEvents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching content events:", error);
    return NextResponse.json(
      { error: "Failed to fetch content events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      type,
      status,
      creator,
      tags,
      price,
      color,
      contentLink,
      editedVideoLink,
      flyerLink,
      liveType,
      platform,
      notes,
      attachments,
    } = body;

    // Validate required fields
    if (!date || !type) {
      return NextResponse.json(
        { error: "Date and type are required" },
        { status: 400 }
      );
    }

    // Find creator by clientName if provided
    let creatorId = null;
    if (creator) {
      const clientModel = await prisma.clientModel.findUnique({
        where: { clientName: creator },
        select: { id: true },
      });
      if (clientModel) {
        creatorId = clientModel.id;
      }
    }

    // Create the event
    const event = await prisma.contentEvent.create({
      data: {
        title: title || `${type} - ${new Date(date).toLocaleDateString()}`,
        description,
        date: new Date(date),
        time,
        type,
        status: status || "SCHEDULED",
        color: color || "PINK",
        creatorId,
        createdById: session.user.id,
        tags: tags || [],
        price: price ? parseFloat(price) : null,
        contentLink,
        editedVideoLink,
        flyerLink,
        liveType,
        platform,
        notes,
        attachments,
      },
      include: {
        creator: {
          select: {
            clientName: true,
            profileLink: true,
            profilePicture: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform event to convert Google Drive links
    const transformedEvent = {
      ...event,
      creator: event.creator ? {
        ...event.creator,
        profilePicture: convertGoogleDriveLink(event.creator.profileLink) || convertGoogleDriveLink(event.creator.profilePicture) || null,
      } : null,
    };

    return NextResponse.json({ event: transformedEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating content event:", error);
    return NextResponse.json(
      { error: "Failed to create content event" },
      { status: 500 }
    );
  }
}
