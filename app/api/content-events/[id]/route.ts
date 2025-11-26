import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.contentEvent.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("Error fetching content event:", error);
    return NextResponse.json(
      { error: "Failed to fetch content event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Find creator by clientName if provided
    let creatorId = undefined;
    if (creator !== undefined) {
      if (creator === null || creator === "") {
        creatorId = null;
      } else {
        const clientModel = await prisma.clientModel.findUnique({
          where: { clientName: creator },
          select: { id: true },
        });
        if (clientModel) {
          creatorId = clientModel.id;
        }
      }
    }

    // Build update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED" && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
      if (status === "CANCELLED" && !updateData.cancelledAt) {
        updateData.cancelledAt = new Date();
      }
    }
    if (color !== undefined) updateData.color = color;
    if (creatorId !== undefined) updateData.creatorId = creatorId;
    if (tags !== undefined) updateData.tags = tags;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (contentLink !== undefined) updateData.contentLink = contentLink;
    if (editedVideoLink !== undefined) updateData.editedVideoLink = editedVideoLink;
    if (flyerLink !== undefined) updateData.flyerLink = flyerLink;
    if (liveType !== undefined) updateData.liveType = liveType;
    if (platform !== undefined) updateData.platform = platform;
    if (notes !== undefined) updateData.notes = notes;
    if (attachments !== undefined) updateData.attachments = attachments;

    const event = await prisma.contentEvent.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("Error updating content event:", error);
    return NextResponse.json(
      { error: "Failed to update content event" },
      { status: 500 }
    );
  }
}

// PUT method as alias to PATCH for compatibility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

// Soft delete - marks event as deleted instead of removing it
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Soft delete by setting deletedAt timestamp
    const event = await prisma.contentEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error("Error deleting content event:", error);
    return NextResponse.json(
      { error: "Failed to delete content event" },
      { status: 500 }
    );
  }
}
