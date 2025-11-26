import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Permanently delete an event from the database
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

    // Check if event exists and is already soft-deleted
    const event = await prisma.contentEvent.findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.deletedAt) {
      return NextResponse.json(
        { error: "Can only permanently delete events that have been soft-deleted first" },
        { status: 400 }
      );
    }

    // Permanently delete from database
    await prisma.contentEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Event permanently deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error permanently deleting content event:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete content event" },
      { status: 500 }
    );
  }
}
