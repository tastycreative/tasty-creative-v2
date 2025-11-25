import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const tags = searchParams.get("tags");

    // Build filter conditions
    const where: any = {};

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

    return NextResponse.json({ events }, { status: 200 });
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

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating content event:", error);
    return NextResponse.json(
      { error: "Failed to create content event" },
      { status: 500 }
    );
  }
}
